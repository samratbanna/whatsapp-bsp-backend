import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WalletService } from './wallet.service';
import {
  TransactionReason,
  TransactionType,
  WalletCategory,
} from './schemas/wallet.schema';
import { fakeWalletModels } from '../../test-utils/fake-wallet-models';

const RESELLER = new Types.ObjectId().toHexString();
const CLIENT = new Types.ObjectId().toHexString();
const T = WalletCategory.TRANSACTIONAL;

const allocate = (credits: number) => ({
  category: T,
  credits,
  performedBy: 'u1',
  netAddedOn: 'receiver' as const,
  fromDescription: 'out',
  toDescription: 'in',
});

async function setup(resellerCredits = 100, clientCredits = 0) {
  const m = fakeWalletModels();
  await m.seed(RESELLER, {
    transactional: resellerCredits,
    totalTransactionalAdded: resellerCredits,
  });
  await m.seed(CLIENT, {
    transactional: clientCredits,
    lowTransactionalAlertSent: true,
  });
  return { ...m, service: new WalletService(m.walletModel, m.txModel) };
}

describe('WalletService.transferCredits', () => {
  it('moves credits, writes two linked ledger rows and counts them as added for the client', async () => {
    const { service, wallet, txs } = await setup(100);
    const res = await service.transferCredits(RESELLER, CLIENT, allocate(40));

    expect(wallet(RESELLER).transactional).toBe(60);
    expect(wallet(CLIENT).transactional).toBe(40);
    expect(wallet(CLIENT).totalTransactionalAdded).toBe(40);
    expect(wallet(RESELLER).totalTransactionalAdded).toBe(100); // reseller's own totals untouched
    expect(wallet(CLIENT).lowTransactionalAlertSent).toBe(false);
    expect(res.from.transactional).toBe(60);
    expect(res.to.transactional).toBe(40);

    expect(txs).toHaveLength(2);
    const [out, inn] = txs;
    expect(out).toMatchObject({
      type: TransactionType.DEBIT,
      reason: TransactionReason.TRANSFER,
      creditsBefore: 100,
      creditsAfter: 60,
      transferId: res.transferId,
    });
    expect(inn).toMatchObject({
      type: TransactionType.CREDIT,
      reason: TransactionReason.TRANSFER,
      creditsBefore: 0,
      creditsAfter: 40,
      transferId: res.transferId,
    });
    expect(String(out.counterparty)).toBe(CLIENT);
    expect(String(inn.counterparty)).toBe(RESELLER);
  });

  it('refuses more than the sender has and moves nothing', async () => {
    const { service, wallet, txs } = await setup(30);
    await expect(
      service.transferCredits(RESELLER, CLIENT, allocate(31)),
    ).rejects.toThrow(BadRequestException);
    expect(wallet(RESELLER).transactional).toBe(30);
    expect(wallet(CLIENT).transactional).toBe(0);
    expect(txs).toHaveLength(0);
  });

  it('two racing transfers can never overdraw the sender', async () => {
    const { service, wallet } = await setup(100);
    const results = await Promise.allSettled([
      service.transferCredits(RESELLER, CLIENT, allocate(60)),
      service.transferCredits(RESELLER, CLIENT, allocate(60)),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(wallet(RESELLER).transactional).toBe(40);
    expect(wallet(CLIENT).transactional).toBe(60);
  });

  it('puts the credits back on the sender if crediting the receiver fails', async () => {
    const { service, wallet, walletModel } = await setup(100);
    const real = walletModel.findOneAndUpdate.getMockImplementation();
    walletModel.findOneAndUpdate
      .mockImplementationOnce(real) // sender debit succeeds
      .mockImplementationOnce(async () => {
        throw new Error('connection reset');
      });

    await expect(
      service.transferCredits(RESELLER, CLIENT, allocate(25)),
    ).rejects.toThrow(InternalServerErrorException);
    expect(wallet(RESELLER).transactional).toBe(100);
    expect(wallet(CLIENT).transactional).toBe(0);
  });

  it("a revoke takes credits back and reduces the client's added total", async () => {
    const { service, wallet } = await setup(100);
    await service.transferCredits(RESELLER, CLIENT, allocate(50));
    await service.transferCredits(CLIENT, RESELLER, {
      ...allocate(20),
      netAddedOn: 'sender',
    });

    expect(wallet(CLIENT).transactional).toBe(30);
    expect(wallet(CLIENT).totalTransactionalAdded).toBe(30);
    expect(wallet(RESELLER).transactional).toBe(70);
    expect(wallet(RESELLER).totalTransactionalAdded).toBe(100);
  });

  it('rejects a transfer to the same wallet and non-positive amounts', async () => {
    const { service } = await setup(100);
    await expect(
      service.transferCredits(RESELLER, RESELLER, allocate(1)),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.transferCredits(RESELLER, CLIENT, allocate(0)),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.transferCredits(RESELLER, CLIENT, allocate(1.5)),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('WalletService.deductCredit (atomic)', () => {
  it('deducts one credit and records the before/after snapshot', async () => {
    const { service, wallet } = await setup(0, 5);
    const tx: any = await service.deductCredit(CLIENT, T);
    expect(wallet(CLIENT).transactional).toBe(4);
    expect(wallet(CLIENT).totalTransactionalUsed).toBe(1);
    expect(tx).toMatchObject({
      creditsBefore: 5,
      creditsAfter: 4,
      reason: TransactionReason.MESSAGE_USE,
    });
  });

  it('blocks at zero balance when blockOnEmpty is on', async () => {
    const { service, wallet } = await setup(0, 0);
    await expect(service.deductCredit(CLIENT, T)).rejects.toThrow(
      BadRequestException,
    );
    expect(wallet(CLIENT).totalTransactionalUsed).toBe(0);
  });

  it('lets the send through at zero (usage counted, balance stays 0) when blockOnEmpty is off', async () => {
    const { service, wallet } = await setup(0, 0);
    wallet(CLIENT).blockOnEmpty = false;
    const tx: any = await service.deductCredit(CLIENT, T);
    expect(wallet(CLIENT).transactional).toBe(0);
    expect(wallet(CLIENT).totalTransactionalUsed).toBe(1);
    expect(tx).toMatchObject({ creditsBefore: 0, creditsAfter: 0 });
  });

  it('concurrent sends never take the balance below zero', async () => {
    const { service, wallet } = await setup(0, 3);
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => service.deductCredit(CLIENT, T)),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    expect(wallet(CLIENT).transactional).toBe(0);
  });

  it('a transfer racing sends on the same wallet loses no update', async () => {
    const { service, wallet } = await setup(100);
    await Promise.all([
      service.deductCredit(RESELLER, T),
      service.transferCredits(RESELLER, CLIENT, allocate(50)),
      service.deductCredit(RESELLER, T),
    ]);
    expect(wallet(RESELLER).transactional).toBe(48);
    expect(wallet(CLIENT).transactional).toBe(50);
  });
});
