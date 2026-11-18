import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { crc32 } from 'zlib';
import { BillingService } from './billing.service';
import { AirpayService } from './gateways/airpay.service';
import { OrderStatus } from './schemas/order.schema';
import { WalletService } from '../wallet/wallet.service';
import { TransactionReason } from '../wallet/schemas/wallet.schema';
import { OrgStatus } from '../../common/enums';
import { fakeWalletModels } from '../../test-utils/fake-wallet-models';

// Stubbed out: the real modules pull in Mongoose schemas whose cross-file enum types ts-jest
// (isolatedModules) cannot resolve. Plain objects are injected below instead.
jest.mock('../organizations/organizations.service', () => ({
  OrganizationsService: class {},
}));
jest.mock('../users/users.service', () => ({ UsersService: class {} }));
jest.mock('../plans/plans.service', () => ({ PlansService: class {} }));

const ORG = new Types.ObjectId().toHexString();
const USER = new Types.ObjectId().toHexString();
const ORDER_NO = 'WB261118ABCDEFGHIJ';

const plan = {
  _id: new Types.ObjectId(),
  name: 'Starter',
  slug: 'starter',
  transactionalCredits: 5000,
  promotionalCredits: 1000,
  authenticationCredits: 0,
  price: 1999,
  gstPercent: 18,
};

function fakeOrderModel() {
  const orders: any[] = [];
  const match = (o: any, f: any) =>
    Object.entries(f).every(([k, c]: [string, any]) =>
      c && typeof c === 'object' && '$ne' in c
        ? o[k] !== c.$ne
        : String(o[k]) === String(c),
    );
  const model: any = {
    orders,
    create: jest.fn(async (doc: any) => {
      const o = {
        _id: new Types.ObjectId(),
        status: OrderStatus.CREATED,
        gateway: 'airpay',
        currency: 'INR',
        createdAt: new Date(),
        ...doc,
        orderNumber: ORDER_NO,
      };
      orders.push(o);
      return o;
    }),
    findOne: jest.fn(async (f: any) => orders.find((o) => match(o, f)) ?? null),
    findById: jest.fn(
      async (id: any) =>
        orders.find((o) => String(o._id) === String(id)) ?? null,
    ),
    findOneAndUpdate: jest.fn(async (f: any, u: any) => {
      const o = orders.find((x) => match(x, f));
      if (!o) return null;
      Object.assign(o, u.$set);
      return o;
    }),
    updateOne: jest.fn(async (f: any, u: any) => {
      const o = orders.find((x) => match(x, f));
      if (o) Object.assign(o, u.$set);
      return { modifiedCount: o ? 1 : 0 };
    }),
    exists: jest.fn(async (f: any) => orders.some((o) => match(o, f))),
  };
  return model;
}

function setup({ sandbox = false, org = {} as any } = {}) {
  const env: Record<string, string> = {
    AIRPAY_MERCHANT_ID: '12345',
    AIRPAY_USERNAME: 'user1',
    AIRPAY_PASSWORD: 'pass1',
    AIRPAY_SECRET: 's',
    AIRPAY_CLIENT_ID: 'c',
    AIRPAY_CLIENT_SECRET: 'cs',
    AIRPAY_ENV: sandbox ? 'sandbox' : 'production',
  };
  const airpay = new AirpayService({ get: (k: string) => env[k] } as any);
  jest.spyOn(airpay, 'getAccessToken').mockResolvedValue('tok');
  const verify = jest.spyOn(airpay, 'verify');

  const w = fakeWalletModels();
  const walletService = new WalletService(w.walletModel, w.txModel);
  const orgDoc = {
    _id: new Types.ObjectId(ORG),
    name: 'Acme',
    status: OrgStatus.TRIAL,
    reseller: null,
    phone: '',
    ...org,
  };
  const orgsService: any = {
    findOne: jest.fn(async (id: string) =>
      id === ORG ? orgDoc : { _id: id, name: 'Big Reseller' },
    ),
    activate: jest.fn(async () => {
      orgDoc.status = OrgStatus.ACTIVE;
    }),
  };
  const usersService: any = {
    findOne: jest.fn(async () => ({
      name: 'Asha Rao',
      email: 'asha@acme.in',
      phone: '9876543210',
    })),
    update: jest.fn(),
  };
  const plansService: any = { findActive: jest.fn(async () => plan) };
  const orderModel = fakeOrderModel();

  const service = new BillingService(
    orderModel,
    airpay,
    plansService,
    orgsService,
    usersService,
    walletService,
  );
  const success = (over: any = {}) => ({
    orderId: ORDER_NO,
    apTransactionId: '987',
    amount: '2358.82',
    status: '200',
    paymentStatus: 'SUCCESS',
    message: 'Success',
    chmod: 'pg',
    customerVpa: '',
    merchantId: '12345',
    secureHash: '',
    ...over,
  });
  const signed = (t: any) => ({
    ...t,
    secureHash: String(
      crc32(
        Buffer.from(
          [
            t.orderId,
            t.apTransactionId,
            t.amount,
            t.status,
            t.message,
            '12345',
            'user1',
          ].join(':'),
        ),
      ) >>> 0,
    ),
  });
  const credits = () => w.wallet(ORG) ?? { transactional: 0, promotional: 0 };
  return { service, verify, orderModel, w, orgDoc, success, signed, credits };
}

describe('BillingService', () => {
  it('creates an order with GST in paise and an Airpay form', async () => {
    const { service } = setup();
    const res = await service.createOrder(ORG, USER, { plan: 'starter' });
    // 1999 + 18% = 2358.82
    expect(res.order).toMatchObject({
      orderNumber: ORDER_NO,
      status: OrderStatus.CREATED,
      subtotal: 1999,
      gst: 359.82,
      total: 2358.82,
      amount: '2358.82',
    });
    expect(res.payment.url).toContain('?token=tok');
  });

  it("refuses checkout for a reseller's client", async () => {
    const { service } = setup({ org: { reseller: new Types.ObjectId() } });
    await expect(
      service.createOrder(ORG, USER, { plan: 'starter' }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.createOrder(ORG, USER, { plan: 'starter' }),
    ).rejects.toThrow(/Big Reseller/);
  });

  describe('production (verify API is the only source of truth)', () => {
    it('a forged "success" callback credits nothing when Airpay says otherwise', async () => {
      const { service, verify, orderModel, credits, success } = setup();
      await service.createOrder(ORG, USER, { plan: 'starter' });
      verify.mockResolvedValue(
        success({ status: '400', paymentStatus: 'FAILED', message: 'Failed' }),
      );

      await service.handleReturn(
        {
          TRANSACTIONID: ORDER_NO,
          TRANSACTIONSTATUS: '200',
          AMOUNT: '2358.82',
        },
        {},
      );
      expect(verify).toHaveBeenCalledWith(ORDER_NO);
      expect(orderModel.orders[0].status).toBe(OrderStatus.FAILED);
      expect(credits().transactional).toBe(0);
    });

    it('verified success marks paid, loads every category once, and ends the trial', async () => {
      const { service, verify, orderModel, credits, orgDoc, w, success } =
        setup();
      await service.createOrder(ORG, USER, { plan: 'starter' });
      verify.mockResolvedValue(success());

      // Return redirect, IPN and the result page's poll all land together.
      await Promise.all([
        service.handleReturn({ orderid: ORDER_NO }, {}),
        service.handleIpn({ orderid: ORDER_NO }),
        service.confirm(ORDER_NO, null, 'poll'),
      ]);
      await service.confirm(ORDER_NO, null, 'cron');

      expect(orderModel.orders[0]).toMatchObject({
        status: OrderStatus.PAID,
        gatewayTxnId: '987',
        paidVia: 'gateway',
      });
      expect(orderModel.orders[0].creditsAppliedAt).toBeInstanceOf(Date);
      expect(credits().transactional).toBe(5000);
      expect(credits().promotional).toBe(1000);
      expect(
        w.txs.filter((t) => t.reason === TransactionReason.PURCHASE),
      ).toHaveLength(2);
      expect(orgDoc.status).toBe(OrgStatus.ACTIVE);
    });

    it('does not credit when the paid amount differs from the order', async () => {
      const { service, verify, orderModel, credits, success } = setup();
      await service.createOrder(ORG, USER, { plan: 'starter' });
      verify.mockResolvedValue(success({ amount: '1.00' }));

      await service.handleIpn({ orderid: ORDER_NO });
      expect(orderModel.orders[0].status).toBe(OrderStatus.FAILED);
      expect(orderModel.orders[0].gatewayMessage).toMatch(/Amount mismatch/);
      expect(credits().transactional).toBe(0);
    });

    it('keeps the order open while processing, and a late success after a failure still pays', async () => {
      const { service, verify, orderModel, credits, success } = setup();
      await service.createOrder(ORG, USER, { plan: 'starter' });

      verify.mockResolvedValueOnce(
        success({ status: '211', message: 'In process' }),
      );
      await service.confirm(ORDER_NO, null, 'poll');
      expect(orderModel.orders[0].status).toBe(OrderStatus.PENDING);

      verify.mockResolvedValueOnce(
        success({ status: '400', message: 'Failed' }),
      );
      await service.confirm(ORDER_NO, null, 'poll');
      expect(orderModel.orders[0].status).toBe(OrderStatus.FAILED);

      verify.mockResolvedValueOnce(success());
      await service.confirm(ORDER_NO, null, 'cron');
      expect(orderModel.orders[0].status).toBe(OrderStatus.PAID);
      expect(credits().transactional).toBe(5000);
    });

    it('leaves the order untouched when Airpay cannot be reached', async () => {
      const { service, verify, orderModel } = setup();
      await service.createOrder(ORG, USER, { plan: 'starter' });
      verify.mockRejectedValue(new Error('ETIMEDOUT'));
      await service.handleIpn({ orderid: ORDER_NO });
      expect(orderModel.orders[0].status).toBe(OrderStatus.CREATED);
      expect(orderModel.orders[0].lastCheckedAt).toBeInstanceOf(Date);
    });
  });

  describe('sandbox (no verify API)', () => {
    it('accepts a callback whose ap_SecureHash checks out', async () => {
      const { service, verify, orderModel, credits, success, signed } = setup({
        sandbox: true,
      });
      await service.createOrder(ORG, USER, { plan: 'starter' });
      const t = signed(success());
      await service.handleReturn(
        {
          orderid: t.orderId,
          ap_transactionid: t.apTransactionId,
          amount: t.amount,
          transaction_status: t.status,
          message: t.message,
          ap_SecureHash: t.secureHash,
        },
        {},
      );
      expect(verify).not.toHaveBeenCalled();
      expect(orderModel.orders[0].status).toBe(OrderStatus.PAID);
      expect(credits().transactional).toBe(5000);
    });

    it('ignores a callback with a bad hash', async () => {
      const { service, orderModel, credits } = setup({ sandbox: true });
      await service.createOrder(ORG, USER, { plan: 'starter' });
      await service.handleReturn(
        {
          orderid: ORDER_NO,
          amount: '2358.82',
          transaction_status: '200',
          ap_SecureHash: '12345',
        },
        {},
      );
      expect(orderModel.orders[0].status).toBe(OrderStatus.CREATED);
      expect(credits().transactional).toBe(0);
    });
  });

  it('manual mark-paid loads credits once and cannot be repeated', async () => {
    const { service, orderModel, credits } = setup();
    await service.createOrder(ORG, USER, { plan: 'starter' });
    await service.markPaid(
      ORDER_NO,
      { note: 'seen on Airpay dashboard' },
      'admin1',
    );
    await expect(
      service.markPaid(ORDER_NO, { note: 'again' }, 'admin1'),
    ).rejects.toThrow(/already paid/);
    expect(orderModel.orders[0]).toMatchObject({
      status: OrderStatus.PAID,
      paidVia: 'manual',
    });
    expect(credits().transactional).toBe(5000);
  });
});
