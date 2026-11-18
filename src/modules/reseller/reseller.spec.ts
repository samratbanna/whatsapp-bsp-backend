import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ResellerGuard } from './guards/reseller.guard';
import { ResellerService } from './reseller.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletCategory } from '../wallet/schemas/wallet.schema';
import { OrgStatus, Role } from '../../common/enums';
import { fakeWalletModels } from '../../test-utils/fake-wallet-models';

jest.mock('../organizations/organizations.service', () => ({
  OrganizationsService: class {},
}));
jest.mock('../users/users.service', () => ({ UsersService: class {} }));
jest.mock('../billing/billing.service', () => ({ BillingService: class {} }));

const RESELLER = new Types.ObjectId().toHexString();
const MY_CLIENT = new Types.ObjectId().toHexString();
const OTHER_CLIENT = new Types.ObjectId().toHexString();
const T = WalletCategory.TRANSACTIONAL;

const resellerOrg: any = {
  _id: new Types.ObjectId(RESELLER),
  name: 'Big Reseller',
  isReseller: true,
  status: OrgStatus.ACTIVE,
};
const clientOrg: any = {
  _id: new Types.ObjectId(MY_CLIENT),
  name: 'Client One',
  reseller: resellerOrg._id,
};

describe('ResellerGuard', () => {
  const ctx = (user: any) => {
    const req: any = { user };
    return {
      req,
      ctx: { switchToHttp: () => ({ getRequest: () => req }) } as any,
    };
  };
  const guard = (org: any) =>
    new ResellerGuard({ findOne: jest.fn(async () => org) } as any);
  const admin = { role: Role.ORG_ADMIN, orgId: RESELLER };

  it('lets the reseller org admin in and attaches the organization', async () => {
    const { req, ctx: c } = ctx(admin);
    await expect(guard(resellerOrg).canActivate(c)).resolves.toBe(true);
    expect(req.reseller).toBe(resellerOrg);
  });

  it('turns away agents, super admin, non-reseller orgs and suspended resellers', async () => {
    await expect(
      guard(resellerOrg).canActivate(ctx({ ...admin, role: Role.AGENT }).ctx),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard(resellerOrg).canActivate(ctx({ role: Role.SUPER_ADMIN }).ctx),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard({ ...resellerOrg, isReseller: false }).canActivate(ctx(admin).ctx),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard({ ...resellerOrg, status: OrgStatus.SUSPENDED }).canActivate(
        ctx(admin).ctx,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('ResellerService', () => {
  async function setup(resellerCredits = 1000) {
    const w = fakeWalletModels();
    await w.seed(RESELLER, { transactional: resellerCredits });
    const walletService = new WalletService(
      w.walletModel,
      w.txModel,
      w.balanceTxModel,
    );
    const orgsService: any = {
      findClientOf: jest.fn(async (resellerId: string, clientId: string) => {
        if (resellerId === RESELLER && clientId === MY_CLIENT) return clientOrg;
        throw new NotFoundException('Client not found');
      }),
      create: jest.fn(async () => clientOrg),
      setRates: jest.fn(async (_id: string, rates: any) => ({
        ...clientOrg,
        rates,
      })),
    };
    const service = new ResellerService(
      orgsService,
      {} as any,
      walletService,
      {} as any,
      {} as any,
    );
    return { service, w, orgsService };
  }

  it('allocates from the reseller to its client and revokes back', async () => {
    const { service, w } = await setup(1000);
    const a = await service.allocate(
      resellerOrg,
      MY_CLIENT,
      { category: T, credits: 300, note: 'paid UPI' },
      'u1',
    );
    expect(a).toMatchObject({
      direction: 'allocate',
      resellerCredits: { transactional: 700 },
      clientCredits: { transactional: 300 },
    });
    expect(w.txs[0].description).toContain('Client One');
    expect(w.txs[0].description).toContain('paid UPI');

    const r = await service.revoke(
      resellerOrg,
      MY_CLIENT,
      { category: T, credits: 100 },
      'u1',
    );
    expect(r).toMatchObject({
      direction: 'revoke',
      resellerCredits: { transactional: 800 },
      clientCredits: { transactional: 200 },
    });
  });

  it("can't touch another reseller's client", async () => {
    const { service, w } = await setup(1000);
    await expect(
      service.allocate(
        resellerOrg,
        OTHER_CLIENT,
        { category: T, credits: 10 },
        'u1',
      ),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.revoke(
        resellerOrg,
        OTHER_CLIENT,
        { category: T, credits: 10 },
        'u1',
      ),
    ).rejects.toThrow(NotFoundException);
    expect(w.wallet(RESELLER).transactional).toBe(1000);
  });

  it("can't revoke more than the client has", async () => {
    const { service } = await setup(1000);
    await service.allocate(
      resellerOrg,
      MY_CLIENT,
      { category: T, credits: 50 },
      'u1',
    );
    await expect(
      service.revoke(
        resellerOrg,
        MY_CLIENT,
        { category: T, credits: 51 },
        'u1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('checks opening credits before creating the client', async () => {
    const { service, orgsService } = await setup(100);
    const dto: any = {
      name: 'New Co',
      ownerEmail: 'o@new.co',
      ownerPassword: 'Passw0rd!',
      initialCredits: { transactional: 500 },
    };
    await expect(service.createClient(resellerOrg, dto, 'u1')).rejects.toThrow(
      /Not enough credits/,
    );
    expect(orgsService.create).not.toHaveBeenCalled();
  });

  it('creates the client as active under the reseller and moves the opening balance', async () => {
    const { service, orgsService, w } = await setup(1000);
    const dto: any = {
      name: 'New Co',
      ownerEmail: 'o@new.co',
      ownerPassword: 'Passw0rd!',
      initialCredits: { transactional: 250 },
    };
    const res = await service.createClient(resellerOrg, dto, 'u1');
    expect(orgsService.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ initialCredits: expect.anything() }),
      {
        createAdminUser: true,
        resellerId: RESELLER,
        source: 'reseller',
        status: OrgStatus.ACTIVE,
      },
    );
    expect(res.credits.transactional).toBe(250);
    expect(w.wallet(RESELLER).transactional).toBe(750);
  });

  it('sets rates and loads an opening balance when creating the client', async () => {
    const { service, orgsService, w } = await setup(1000);
    const dto: any = {
      name: 'New Co',
      ownerEmail: 'o@new.co',
      ownerPassword: 'Passw0rd!',
      rates: { transactional: 18 },
      openingBalance: 500.5,
    };
    const res = await service.createClient(resellerOrg, dto, 'u1');
    expect(orgsService.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        rates: expect.anything(),
        openingBalance: expect.anything(),
      }),
      expect.anything(),
    );
    expect(orgsService.setRates).toHaveBeenCalledWith(MY_CLIENT, {
      transactional: 18,
    });
    expect(res.organization.rates).toEqual({ transactional: 18 });
    expect(res.credits.balance).toBe(500.5);
    expect(w.balanceTxs[0]).toMatchObject({
      reason: 'reseller_add',
      amountPaise: 50050,
    });
  });

  it("adds and deducts the client's balance, never below zero, only for its own client", async () => {
    const { service, w } = await setup();
    await expect(
      service.changeClientBalance(
        resellerOrg,
        MY_CLIENT,
        { amount: 1000, note: 'UPI' },
        'u1',
        'add',
      ),
    ).resolves.toEqual({ balance: 1000 });
    await expect(
      service.changeClientBalance(
        resellerOrg,
        MY_CLIENT,
        { amount: 250.25 },
        'u1',
        'deduct',
      ),
    ).resolves.toEqual({ balance: 749.75 });
    await expect(
      service.changeClientBalance(
        resellerOrg,
        MY_CLIENT,
        { amount: 750 },
        'u1',
        'deduct',
      ),
    ).rejects.toThrow(/Insufficient balance/);
    await expect(
      service.changeClientBalance(
        resellerOrg,
        OTHER_CLIENT,
        { amount: 10 },
        'u1',
        'add',
      ),
    ).rejects.toThrow(NotFoundException);
    expect(w.wallet(MY_CLIENT).balancePaise).toBe(74975);
    expect(w.balanceTxs[0].description).toContain('Big Reseller — UPI');
  });

  it("sets only its own client's rates", async () => {
    const { service, orgsService } = await setup();
    await expect(
      service.setClientRates(RESELLER, MY_CLIENT, {
        transactional: 20,
        promotional: null,
      }),
    ).resolves.toEqual({
      rates: { transactional: 20, promotional: null, authentication: null },
    });
    await expect(
      service.setClientRates(RESELLER, OTHER_CLIENT, { transactional: 1 }),
    ).rejects.toThrow(NotFoundException);
    expect(orgsService.setRates).toHaveBeenCalledTimes(1);
  });
});
