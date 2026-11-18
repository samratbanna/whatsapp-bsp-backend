import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WalletService } from './wallet.service';
import { TransactionReason, WalletCategory } from './schemas/wallet.schema';
import { PartnerSecretGuard } from '../public-api/guards/partner-secret.guard';

/**
 * A partner retries a paid top-up until it hears back, so the property that matters is that a
 * reference credits the wallet exactly once — sequentially and when two requests race.
 *
 * The wallet model below applies the same conditional update Mongo would: it matches only while
 * the reference is not in `topupRefs`, and the match and the increment happen together.
 */

const ORG = new Types.ObjectId().toHexString();

function makeService(start = { transactional: 50, promotional: 0, authentication: 0 }) {
  const wallet: any = {
    _id: new Types.ObjectId(),
    organization: new Types.ObjectId(ORG),
    ...start,
    totalTransactionalAdded: 0,
    totalPromotionalAdded: 0,
    totalAuthenticationAdded: 0,
    lowTransactionalAlertSent: true,
    lowPromotionalAlertSent: false,
    lowAuthenticationAlertSent: false,
    lowTransactionalThreshold: 100,
    lowPromotionalThreshold: 100,
    lowAuthenticationThreshold: 20,
    blockOnEmpty: true,
    topupRefs: [] as string[],
  };
  const txs: any[] = [];

  const walletModel: any = {
    findOne: jest.fn(async () => wallet),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(async (filter: any, update: any) => {
      if (wallet.topupRefs.includes(filter.topupRefs.$ne)) return null;
      for (const [k, v] of Object.entries(update.$inc)) wallet[k] += v as number;
      for (const [k, v] of Object.entries(update.$set)) wallet[k] = v;
      wallet.topupRefs.push(...update.$push.topupRefs.$each);
      wallet.topupRefs = wallet.topupRefs.slice(update.$push.topupRefs.$slice);
      return { ...wallet };
    }),
  };
  const txModel: any = {
    findOne: jest.fn(async (q: any) => txs.find((t) => t.reference === q.reference) ?? null),
    create: jest.fn(async (doc: any) => {
      const row = { _id: new Types.ObjectId(), ...doc };
      txs.push(row);
      return row;
    }),
  };

  const service = new WalletService(walletModel, txModel);
  return { service, wallet, txs, walletModel, txModel };
}

const topup = (reference: string, credits = 1000) => ({
  category: WalletCategory.TRANSACTIONAL,
  credits,
  reference,
});

describe('WalletService.partnerTopup', () => {
  it('adds the credits, resets the low-credit alert and writes a PURCHASE ledger row', async () => {
    const { service, wallet, txs } = makeService();
    const res = await service.partnerTopup(ORG, topup('WA1:0'));

    expect(res.duplicate).toBe(false);
    expect(wallet.transactional).toBe(1050);
    expect(wallet.totalTransactionalAdded).toBe(1000);
    expect(wallet.lowTransactionalAlertSent).toBe(false);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({
      reason: TransactionReason.PURCHASE,
      reference: 'WA1:0',
      creditsBefore: 50,
      creditsAfter: 1050,
      performedBy: 'partner',
    });
    expect(res.credits.transactional).toBe(1050);
  });

  it('credits a repeated reference only once', async () => {
    const { service, wallet, txs } = makeService();
    await service.partnerTopup(ORG, topup('WA1:0'));
    const again = await service.partnerTopup(ORG, topup('WA1:0'));

    expect(again.duplicate).toBe(true);
    expect(again.transaction?._id).toEqual(txs[0]._id);
    expect(wallet.transactional).toBe(1050);
    expect(txs).toHaveLength(1);
  });

  it('credits once when two requests with one reference race', async () => {
    const { service, wallet, txs } = makeService();
    const [a, b] = await Promise.all([
      service.partnerTopup(ORG, topup('WA2:0')),
      service.partnerTopup(ORG, topup('WA2:0')),
    ]);

    expect([a.duplicate, b.duplicate].sort()).toEqual([false, true]);
    expect(wallet.transactional).toBe(1050);
    expect(txs).toHaveLength(1);
  });

  it('a retry after the ledger write failed is still a no-op', async () => {
    const { service, wallet, txModel } = makeService();
    txModel.create.mockRejectedValueOnce(new Error('disk full'));

    const first = await service.partnerTopup(ORG, topup('WA3:0'));
    expect(first.duplicate).toBe(false);
    expect(first.transaction).toBeNull();

    const retry = await service.partnerTopup(ORG, topup('WA3:0'));
    expect(retry.duplicate).toBe(true);
    expect(wallet.transactional).toBe(1050);
  });

  it('different references both credit', async () => {
    const { service, wallet } = makeService();
    await service.partnerTopup(ORG, topup('WA4:0', 100));
    await service.partnerTopup(ORG, topup('WA5:0', 200));
    expect(wallet.transactional).toBe(350);
  });
});

describe('PartnerSecretGuard', () => {
  const ctx = (headers: Record<string, string>) =>
    ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as any;
  const guard = (secret?: string) => new PartnerSecretGuard({ get: () => secret } as any);

  it('is off when no secret is configured', () => {
    expect(() => guard(undefined).canActivate(ctx({ 'x-partner-secret': 'x' }))).toThrow(ForbiddenException);
    expect(() => guard('  ').canActivate(ctx({ 'x-partner-secret': 'x' }))).toThrow(ForbiddenException);
  });

  it('rejects a missing or wrong secret and accepts the right one', () => {
    const g = guard('s3cret-value');
    expect(() => g.canActivate(ctx({}))).toThrow(UnauthorizedException);
    expect(() => g.canActivate(ctx({ 'x-partner-secret': 's3cret-valuX' }))).toThrow(UnauthorizedException);
    expect(g.canActivate(ctx({ 'x-partner-secret': 's3cret-value' }))).toBe(true);
  });
});
