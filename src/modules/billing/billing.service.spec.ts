import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { crc32 } from 'zlib';
import { BillingService } from './billing.service';
import { AirpayService } from './gateways/airpay.service';
import { OrderStatus } from './schemas/order.schema';
import { WalletService } from '../wallet/wallet.service';
import { TransactionReason } from '../wallet/schemas/wallet.schema';
import { RatesService } from '../rates/rates.service';
import { OrgStatus } from '../../common/enums';
import { fakeWalletModels } from '../../test-utils/fake-wallet-models';

// Stubbed out: the real modules pull in Mongoose schemas whose cross-file enum types ts-jest
// (isolatedModules) cannot resolve. Plain objects are injected below instead.
jest.mock('../organizations/organizations.service', () => ({
  OrganizationsService: class {},
}));
jest.mock('../users/users.service', () => ({ UsersService: class {} }));

const ORG = new Types.ObjectId().toHexString();
const RESELLER = new Types.ObjectId().toHexString();
const USER = new Types.ObjectId().toHexString();
const ORDER_NO = 'WB261118ABCDEFGHIJ';

// Defaults: 13p transactional, 85p promotional, 13p authentication; GST 18%; min ₹100.
// The standard test order — 10,000 transactional + 1,000 promotional — is
// 1,30,000p + 85,000p = ₹2,150 + 18% GST ₹387 = ₹2,537.
const ITEMS = { transactional: 10000, promotional: 1000 };
const TOTAL = '2537.00';

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
      if (
        doc.idempotencyKey &&
        orders.some(
          (o) =>
            String(o.organization) === String(doc.organization) &&
            o.idempotencyKey === doc.idempotencyKey,
        )
      ) {
        throw Object.assign(new Error('E11000'), {
          code: 11000,
          keyPattern: { organization: 1, idempotencyKey: 1 },
        });
      }
      const o = {
        _id: new Types.ObjectId(),
        status: OrderStatus.CREATED,
        gateway: 'airpay',
        currency: 'INR',
        createdAt: new Date(),
        ...doc,
        // Online orders get the fixed number the Airpay fixtures use.
        orderNumber: doc.gateway === 'balance' ? doc.orderNumber : ORDER_NO,
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

function setup({
  sandbox = false,
  org = {} as any,
  reseller = {} as any,
  defaults = { transactional: 13, promotional: 85, authentication: 13 } as any,
} = {}) {
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
  const walletService = new WalletService(
    w.walletModel,
    w.txModel,
    w.balanceTxModel,
  );
  const orgDoc: any = {
    _id: new Types.ObjectId(ORG),
    name: 'Acme',
    status: OrgStatus.TRIAL,
    reseller: null,
    phone: '',
    ...org,
  };
  const resellerDoc: any = {
    _id: new Types.ObjectId(RESELLER),
    name: 'Big Reseller',
    isReseller: true,
    status: OrgStatus.ACTIVE,
    reseller: null,
    ...reseller,
  };
  const orgsService: any = {
    findOne: jest.fn(async (id: string) => (id === ORG ? orgDoc : resellerDoc)),
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
  const settingsDoc = {
    defaultRates: defaults,
    gstPercent: 18,
    minPurchase: 100,
  };
  const settingsModel: any = {
    findOneAndUpdate: () => ({
      lean: () => ({ exec: async () => settingsDoc }),
    }),
  };
  const ratesService = new RatesService(settingsModel, orgsService);
  const orderModel = fakeOrderModel();

  const service = new BillingService(
    orderModel,
    airpay,
    ratesService,
    orgsService,
    usersService,
    walletService,
  );
  const success = (over: any = {}) => ({
    orderId: ORDER_NO,
    apTransactionId: '987',
    amount: TOTAL,
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
  return {
    service,
    verify,
    orderModel,
    w,
    walletService,
    orgDoc,
    resellerDoc,
    success,
    signed,
    credits,
  };
}

describe('BillingService', () => {
  it('prices quantity × rate per category, adds GST, and returns an Airpay form', async () => {
    const { service } = setup();
    const res = await service.createOrder(ORG, USER, { items: ITEMS });
    expect(res.order).toMatchObject({
      orderNumber: ORDER_NO,
      status: OrderStatus.CREATED,
      items: [
        { category: 'transactional', quantity: 10000, rate: 13, amount: 1300 },
        { category: 'promotional', quantity: 1000, rate: 85, amount: 850 },
      ],
      subtotal: 2150,
      gst: 387,
      total: 2537,
      amount: TOTAL,
    });
    expect(res.payment.url).toContain('?token=tok');
  });

  it("uses the organization's own rate over the default", async () => {
    const { service } = setup({ org: { rates: { transactional: 11.5 } } });
    const res = await service.createOrder(ORG, USER, {
      items: { transactional: 1000 },
    });
    // 1000 × 11.5p = ₹115 + 18% = ₹135.70
    expect(res.order).toMatchObject({
      subtotal: 115,
      total: 135.7,
      amount: '135.70',
    });
  });

  it('refuses a category without a rate, an empty order and one below the minimum', async () => {
    const { service } = setup({
      defaults: { transactional: 13, promotional: null, authentication: null },
    });
    await expect(
      service.createOrder(ORG, USER, { items: { promotional: 1000 } }),
    ).rejects.toThrow(/Promotional messages are not available/);
    await expect(service.createOrder(ORG, USER, { items: {} })).rejects.toThrow(
      BadRequestException,
    );
    // 500 × 13p = ₹65 < ₹100
    await expect(
      service.createOrder(ORG, USER, { items: { transactional: 500 } }),
    ).rejects.toThrow(/Minimum purchase is ₹100/);
  });

  it("refuses online checkout for a reseller's client", async () => {
    const { service } = setup({
      org: { reseller: new Types.ObjectId(RESELLER) },
    });
    await expect(
      service.createOrder(ORG, USER, { items: ITEMS }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.createOrder(ORG, USER, { items: ITEMS }),
    ).rejects.toThrow(/Big Reseller/);
  });

  describe('production (verify API is the only source of truth)', () => {
    it('a forged "success" callback credits nothing when Airpay says otherwise', async () => {
      const { service, verify, orderModel, credits, success } = setup();
      await service.createOrder(ORG, USER, { items: ITEMS });
      verify.mockResolvedValue(
        success({ status: '400', paymentStatus: 'FAILED', message: 'Failed' }),
      );

      await service.handleReturn(
        {
          TRANSACTIONID: ORDER_NO,
          TRANSACTIONSTATUS: '200',
          AMOUNT: TOTAL,
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
      await service.createOrder(ORG, USER, { items: ITEMS });
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
      expect(credits().transactional).toBe(10000);
      expect(credits().promotional).toBe(1000);
      expect(
        w.txs.filter((t) => t.reason === TransactionReason.PURCHASE),
      ).toHaveLength(2);
      expect(orgDoc.status).toBe(OrgStatus.ACTIVE);
    });

    it('does not credit when the paid amount differs from the order', async () => {
      const { service, verify, orderModel, credits, success } = setup();
      await service.createOrder(ORG, USER, { items: ITEMS });
      verify.mockResolvedValue(success({ amount: '1.00' }));

      await service.handleIpn({ orderid: ORDER_NO });
      expect(orderModel.orders[0].status).toBe(OrderStatus.FAILED);
      expect(orderModel.orders[0].gatewayMessage).toMatch(/Amount mismatch/);
      expect(credits().transactional).toBe(0);
    });

    it('keeps the order open while processing, and a late success after a failure still pays', async () => {
      const { service, verify, orderModel, credits, success } = setup();
      await service.createOrder(ORG, USER, { items: ITEMS });

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
      expect(credits().transactional).toBe(10000);
    });

    it('leaves the order untouched when Airpay cannot be reached', async () => {
      const { service, verify, orderModel } = setup();
      await service.createOrder(ORG, USER, { items: ITEMS });
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
      await service.createOrder(ORG, USER, { items: ITEMS });
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
      expect(credits().transactional).toBe(10000);
    });

    it('ignores a callback with a bad hash', async () => {
      const { service, orderModel, credits } = setup({ sandbox: true });
      await service.createOrder(ORG, USER, { items: ITEMS });
      await service.handleReturn(
        {
          orderid: ORDER_NO,
          amount: TOTAL,
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
    await service.createOrder(ORG, USER, { items: ITEMS });
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
    expect(credits().transactional).toBe(10000);
  });
});

describe('BillingService — balance purchase (reseller client)', () => {
  // Client pays 18p per transactional / 90p per promotional; the reseller's own (cost) rate is
  // 13p / 85p. 1,000 transactional = ₹180 + 18% = ₹212.40.
  async function client({
    balance = 50_000,
    stock = { transactional: 10_000, promotional: 5_000 },
  } = {}) {
    const ctx = setup({
      org: {
        status: OrgStatus.ACTIVE,
        reseller: new Types.ObjectId(RESELLER),
        rates: { transactional: 18, promotional: 90, authentication: null },
      },
      reseller: { rates: { transactional: 13 } }, // promotional falls back to the 85p default
    });
    await ctx.w.seed(RESELLER, stock);
    await ctx.w.seed(ORG, { balancePaise: balance });
    return ctx;
  }

  it("charges the client's balance at its rates and moves credits out of the reseller's stock", async () => {
    const { service, w, orderModel } = await client();
    const res = await service.buyWithBalance(ORG, USER, {
      items: { transactional: 1000 },
    });

    expect(res.order).toMatchObject({
      status: OrderStatus.PAID,
      gateway: 'balance',
      subtotal: 180,
      gst: 32.4,
      total: 212.4,
    });
    expect(res.balance).toBe(287.6); // ₹500 − ₹212.40
    expect(w.wallet(ORG).transactional).toBe(1000);
    expect(w.wallet(RESELLER).transactional).toBe(9000);
    expect(orderModel.orders[0]).toMatchObject({
      paidVia: 'balance',
      costPaise: 13000,
    });
    expect(orderModel.orders[0].creditsAppliedAt).toBeInstanceOf(Date);
    expect(w.balanceTxs).toHaveLength(1);
    expect(w.balanceTxs[0]).toMatchObject({
      amountPaise: 21240,
      balanceBeforePaise: 50000,
      balanceAfterPaise: 28760,
    });

    // The reseller's view: sold for ₹180, cost ₹130, margin ₹50.
    const sale = service.presentSale(orderModel.orders[0]);
    expect(sale).toMatchObject({ cost: 130, margin: 50 });
  });

  it('refuses when the balance is short, and charges nothing', async () => {
    const { service, w } = await client({ balance: 10_000 }); // ₹100 < ₹212.40
    await expect(
      service.buyWithBalance(ORG, USER, { items: { transactional: 1000 } }),
    ).rejects.toThrow(/Insufficient balance.*Big Reseller/);
    expect(w.wallet(ORG).balancePaise).toBe(10_000);
    expect(w.wallet(RESELLER).transactional).toBe(10_000);
  });

  it("refuses when the reseller hasn't got the credits, before charging", async () => {
    const { service, w } = await client({
      stock: { transactional: 500, promotional: 0 },
    });
    await expect(
      service.buyWithBalance(ORG, USER, { items: { transactional: 1000 } }),
    ).rejects.toThrow(
      /Transactional messages are not available in that quantity/,
    );
    expect(w.wallet(ORG).balancePaise).toBe(50_000);
  });

  it('undoes everything when a credit move fails half-way', async () => {
    const { service, w, walletService, orderModel } = await client();
    const real = walletService.transferCredits.bind(walletService);
    let calls = 0;
    jest
      .spyOn(walletService, 'transferCredits')
      .mockImplementation(async (...args) => {
        calls++;
        // 1st: transactional ok. 2nd: promotional — the reseller's stock ran out meanwhile.
        if (calls === 2)
          throw new BadRequestException('Insufficient promotional credits');
        return real(...args);
      });

    await expect(
      service.buyWithBalance(ORG, USER, {
        items: { transactional: 1000, promotional: 100 },
      }),
    ).rejects.toThrow(/nothing was charged/);

    expect(w.wallet(ORG).balancePaise).toBe(50_000); // refunded
    expect(w.wallet(ORG).transactional).toBe(0); // returned to the reseller
    expect(w.wallet(RESELLER).transactional).toBe(10_000);
    expect(orderModel.orders[0].status).toBe(OrderStatus.FAILED);
  });

  it('a repeated requestId buys once, also when both arrive together', async () => {
    const { service, w } = await client();
    const dto = { items: { transactional: 1000 }, requestId: 'req-12345678' };
    const [a, b] = await Promise.all([
      service.buyWithBalance(ORG, USER, dto),
      service.buyWithBalance(ORG, USER, dto),
    ]);
    const c = await service.buyWithBalance(ORG, USER, dto);
    expect(a.order.orderNumber).toBe(b.order.orderNumber);
    expect(c.order.orderNumber).toBe(a.order.orderNumber);
    expect(w.wallet(ORG).balancePaise).toBe(28_760);
    expect(w.wallet(ORG).transactional).toBe(1000);
  });

  it("can't buy a category the reseller gave no rate, or when either side is suspended", async () => {
    const { service, orgDoc, resellerDoc } = await client();
    await expect(
      service.buyWithBalance(ORG, USER, { items: { authentication: 100 } }),
    ).rejects.toThrow(/Authentication messages are not available/);

    resellerDoc.status = OrgStatus.SUSPENDED;
    await expect(
      service.buyWithBalance(ORG, USER, { items: { transactional: 10 } }),
    ).rejects.toThrow(/Purchases are paused/);

    resellerDoc.status = OrgStatus.ACTIVE;
    orgDoc.status = OrgStatus.SUSPENDED;
    await expect(
      service.buyWithBalance(ORG, USER, { items: { transactional: 10 } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('a direct customer pays online, not from a balance', async () => {
    const { service } = setup();
    await expect(
      service.buyWithBalance(ORG, USER, { items: { transactional: 1000 } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('balance orders are never sent to Airpay or marked paid by hand', async () => {
    const { service, verify, orderModel } = await client();
    const res = await service.buyWithBalance(ORG, USER, {
      items: { transactional: 10 },
    });
    await service.confirm(res.order.orderNumber, null, 'admin');
    expect(verify).not.toHaveBeenCalled();
    await expect(
      service.markPaid(res.order.orderNumber, { note: 'x y z' }, 'a'),
    ).rejects.toThrow(/cannot be marked paid/);
    expect(orderModel.orders[0].status).toBe(OrderStatus.PAID);
  });
});
