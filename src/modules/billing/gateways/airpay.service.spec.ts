import { createHash } from 'crypto';
import { crc32 } from 'zlib';
import { AirpayService, AirpayTxn } from './airpay.service';

const ENV: Record<string, string> = {
  AIRPAY_MERCHANT_ID: '12345',
  AIRPAY_USERNAME: 'user1',
  AIRPAY_PASSWORD: 'pass1',
  AIRPAY_SECRET: 'sec1',
  AIRPAY_CLIENT_ID: 'cid',
  AIRPAY_CLIENT_SECRET: 'csec',
};
const make = (env: Record<string, string> = ENV) =>
  new AirpayService({ get: (k: string) => env[k] } as any);

const txn = (over: Partial<AirpayTxn> = {}): AirpayTxn => ({
  orderId: 'WB2611180000000001',
  apTransactionId: '987654',
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

describe('AirpayService', () => {
  it('is off until every credential is set', () => {
    expect(make({}).configured).toBe(false);
    expect(make({ ...ENV, AIRPAY_CLIENT_SECRET: '' }).configured).toBe(false);
    expect(make().configured).toBe(true);
  });

  it('encdata is a 16-char IV followed by base64, and round-trips', () => {
    const a = make();
    const enc = a.encrypt('{"orderid":"X1","amount":"10.00"}');
    expect(enc.slice(0, 16)).toMatch(/^[0-9a-f]{16}$/);
    expect(() => Buffer.from(enc.slice(16), 'base64')).not.toThrow();
    expect(a.decrypt(enc)).toBe('{"orderid":"X1","amount":"10.00"}');
    expect(a.encrypt('same')).not.toBe(a.encrypt('same')); // fresh IV every time
  });

  it('derives the key as md5(username~:~password) unless AIRPAY_ENCRYPTION_KEY is given', () => {
    const derived = make();
    const explicit = make({
      ...ENV,
      AIRPAY_ENCRYPTION_KEY: createHash('md5')
        .update('user1~:~pass1')
        .digest('hex'),
    });
    expect(explicit.decrypt(derived.encrypt('hello'))).toBe('hello');
    const other = make({
      ...ENV,
      AIRPAY_ENCRYPTION_KEY: 'a197b462cb0350a093f34996f698dc94',
    });
    expect(() => other.decrypt(derived.encrypt('hello'))).toThrow();
  });

  it('checksum = sha256(values sorted by key + YYYY-MM-DD in IST)', () => {
    const a = make();
    // 20:00 UTC on the 18th is already the 19th in India.
    const now = new Date('2026-11-18T20:00:00Z');
    const data = { orderid: 'X1', amount: '10.00', buyer_email: 'a@b.co' };
    const expected = createHash('sha256')
      .update('10.00a@b.coX1' + '2026-11-19')
      .digest('hex');
    expect(a.checksumDate(now)).toBe('2026-11-19');
    expect(a.checksum(data, now)).toBe(expected);
  });

  it('privatekey = sha256(secret@username:|:password)', () => {
    expect(make().privateKey()).toBe(
      createHash('sha256').update('sec1@user1:|:pass1').digest('hex'),
    );
  });

  it('checks ap_SecureHash (crc32), with the VPA appended for UPI', () => {
    const a = make();
    const base = 'WB2611180000000001:987654:2358.82:200:Success:12345:user1';
    const good = String(crc32(Buffer.from(base)) >>> 0);
    expect(a.hasValidSecureHash(txn({ secureHash: good }))).toBe(true);
    expect(
      a.hasValidSecureHash(txn({ secureHash: good, amount: '1.00' })),
    ).toBe(false);
    expect(a.hasValidSecureHash(txn({ secureHash: '' }))).toBe(false);

    const upi = String(crc32(Buffer.from(`${base}:buyer@okaxis`)) >>> 0);
    expect(
      a.hasValidSecureHash(
        txn({ chmod: 'upi', customerVpa: 'buyer@okaxis', secureHash: upi }),
      ),
    ).toBe(true);
    expect(
      a.hasValidSecureHash(
        txn({ chmod: 'upi', customerVpa: 'buyer@okaxis', secureHash: good }),
      ),
    ).toBe(false);
  });

  it('parses callbacks in plain v3-style, plain v4-style and encrypted form', () => {
    const a = make();
    expect(
      a.parseCallback({
        TRANSACTIONID: 'O1',
        APTRANSACTIONID: '77',
        TRANSACTIONSTATUS: '200',
        AMOUNT: '5.00',
        ap_SecureHash: '1',
      }),
    ).toMatchObject({
      orderId: 'O1',
      apTransactionId: '77',
      status: '200',
      amount: '5.00',
      secureHash: '1',
    });
    expect(
      a.parseCallback({
        orderid: 'O2',
        ap_transactionid: '78',
        transaction_status: 400,
        CUSTOMERVPA: 'x@y',
      }),
    ).toMatchObject({ orderId: 'O2', status: '400', customerVpa: 'x@y' });
    const response = a.encrypt(
      JSON.stringify({
        status_code: '200',
        data: { orderid: 'O3', transaction_status: '200' },
      }),
    );
    expect(a.parseCallback({ response })).toMatchObject({
      orderId: 'O3',
      status: '200',
    });
    expect(a.parseCallback({ foo: 'bar' })).toBeNull();
  });

  it('builds the hosted-checkout form with the documented fields', async () => {
    const a = make({
      ...ENV,
      AIRPAY_RETURN_URL: 'https://api.example.com/api/v1/billing/airpay/return',
    });
    jest.spyOn(a, 'getAccessToken').mockResolvedValue('tok 1');
    const form = await a.buildPaymentForm(
      { orderNumber: 'WB1', amount: '2358.82' },
      {
        email: 'a@b.co',
        phone: '9876543210',
        firstName: 'Asha',
        lastName: 'Rao',
      },
    );
    expect(form.url).toBe(
      'https://payments.airpay.co.in/pay/v4/?token=tok%201',
    );
    expect(Object.keys(form.fields).sort()).toEqual([
      'checksum',
      'encdata',
      'merchant_id',
      'privatekey',
    ]);
    const data = JSON.parse(a.decrypt(form.fields.encdata));
    expect(data).toEqual({
      buyer_email: 'a@b.co',
      buyer_phone: '9876543210',
      buyer_firstname: 'Asha',
      buyer_lastname: 'Rao',
      amount: '2358.82',
      orderid: 'WB1',
      currency_code: '356',
      iso_currency: 'inr',
      return_url: 'https://api.example.com/api/v1/billing/airpay/return',
    });
    expect(form.fields.checksum).toBe(a.checksum(data));
  });
});
