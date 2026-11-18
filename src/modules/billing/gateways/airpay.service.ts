import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { crc32 } from 'zlib';

/** One Airpay transaction, normalised from the verify API, the return redirect or an IPN. */
export interface AirpayTxn {
  orderId: string;
  apTransactionId: string;
  amount: string;
  /** transaction_status: 200 success, 211 processing, 400 failed, 503 no record, … */
  status: string;
  paymentStatus: string;
  message: string;
  chmod: string;
  customerVpa: string;
  merchantId: string;
  secureHash: string;
  bankName?: string;
  rrn?: string;
  transactionTime?: string;
}

export interface AirpayPaymentForm {
  gateway: 'airpay';
  method: 'POST';
  url: string;
  fields: Record<string, string>;
}

export interface AirpayBuyer {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}

const DEFAULT_PAYMENT_URL = 'https://payments.airpay.co.in/pay/v4/';
const DEFAULT_API_BASE = 'https://kraken.airpay.co.in/airpay/pay/v4/api';

/**
 * Airpay v4 ("Simple Transaction" hosted checkout). Implements the documented scheme:
 *  - encdata  = 16-char IV + base64(AES-256-CBC(json)), key = AIRPAY_ENCRYPTION_KEY or
 *               md5(username~:~password)
 *  - checksum = sha256(values of the request JSON sorted by key, concatenated, + YYYY-MM-DD)
 *  - privatekey = sha256(secret@username:|:password)
 *  - ap_SecureHash = crc32(orderid:ap_transactionid:amount:transaction_status:message:mid:username[:vpa])
 *
 * The crc32 hash is not a cryptographic signature, so in production a payment is only ever
 * trusted after the server-to-server verify API confirms it (BillingService). The hash is
 * the fallback for sandbox, where Airpay's verify API does not work.
 */
@Injectable()
export class AirpayService {
  private readonly logger = new Logger(AirpayService.name);
  private token: { value: string; expiresAt: number } | null = null;
  private tokenInflight: Promise<string> | null = null;

  constructor(private readonly config: ConfigService) {}

  private get(key: string): string {
    return (this.config.get<string>(key) ?? '').trim();
  }

  private get cfg() {
    const username = this.get('AIRPAY_USERNAME');
    const password = this.get('AIRPAY_PASSWORD');
    return {
      merchantId: this.get('AIRPAY_MERCHANT_ID'),
      username,
      password,
      secret: this.get('AIRPAY_SECRET'),
      clientId: this.get('AIRPAY_CLIENT_ID'),
      clientSecret: this.get('AIRPAY_CLIENT_SECRET'),
      encryptionKey:
        this.get('AIRPAY_ENCRYPTION_KEY') ||
        createHash('md5').update(`${username}~:~${password}`).digest('hex'),
      paymentUrl: this.get('AIRPAY_PAYMENT_URL') || DEFAULT_PAYMENT_URL,
      apiBase: (this.get('AIRPAY_API_BASE') || DEFAULT_API_BASE).replace(
        /\/+$/,
        '',
      ),
      returnUrl: this.get('AIRPAY_RETURN_URL'),
      checksumTimeZone: this.get('AIRPAY_CHECKSUM_TZ') || 'Asia/Kolkata',
    };
  }

  /** All credentials present. Without them, checkout answers 503 and the cron stays idle. */
  get configured(): boolean {
    const c = this.cfg;
    return !!(
      c.merchantId &&
      c.username &&
      c.password &&
      c.secret &&
      c.clientId &&
      c.clientSecret
    );
  }

  /** Sandbox MIDs cannot use the verify API, so confirmation falls back to the secure hash. */
  get isSandbox(): boolean {
    return this.get('AIRPAY_ENV').toLowerCase() === 'sandbox';
  }

  // ── Crypto primitives ──────────────────────────────────────────────

  encrypt(plain: string): string {
    const iv = randomBytes(8).toString('hex'); // 16 ASCII chars, used as the 16-byte IV
    const cipher = createCipheriv(
      'aes-256-cbc',
      this.keyBytes(),
      Buffer.from(iv, 'utf8'),
    );
    return (
      iv +
      Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]).toString(
        'base64',
      )
    );
  }

  decrypt(encdata: string): string {
    const iv = encdata.slice(0, 16);
    const body = Buffer.from(encdata.slice(16), 'base64');
    const decipher = createDecipheriv(
      'aes-256-cbc',
      this.keyBytes(),
      Buffer.from(iv, 'utf8'),
    );
    return Buffer.concat([decipher.update(body), decipher.final()]).toString(
      'utf8',
    );
  }

  private keyBytes(): Buffer {
    const key = Buffer.from(this.cfg.encryptionKey, 'utf8');
    if (key.length !== 32) {
      throw new ServiceUnavailableException(
        'AIRPAY_ENCRYPTION_KEY must be 32 characters',
      );
    }
    return key;
  }

  checksum(data: Record<string, string>, now = new Date()): string {
    const joined = Object.keys(data)
      .sort()
      .map((k) => String(data[k] ?? ''))
      .join('');
    return createHash('sha256')
      .update(joined + this.checksumDate(now))
      .digest('hex');
  }

  /** YYYY-MM-DD in Airpay's timezone (PHP date('Y-m-d') on their side). */
  checksumDate(now = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.cfg.checksumTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  }

  privateKey(): string {
    const c = this.cfg;
    return createHash('sha256')
      .update(`${c.secret}@${c.username}:|:${c.password}`)
      .digest('hex');
  }

  expectedSecureHash(txn: AirpayTxn): string {
    const c = this.cfg;
    let s = [
      txn.orderId,
      txn.apTransactionId,
      txn.amount,
      txn.status,
      txn.message,
      c.merchantId,
      c.username,
    ].join(':');
    if (txn.chmod.toLowerCase() === 'upi') s += `:${txn.customerVpa}`;
    return String(crc32(Buffer.from(s, 'utf8')) >>> 0);
  }

  hasValidSecureHash(txn: AirpayTxn): boolean {
    return (
      !!txn.secureHash && txn.secureHash.trim() === this.expectedSecureHash(txn)
    );
  }

  // ── API calls ──────────────────────────────────────────────────────

  private assertConfigured() {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Online payments are not configured on this server',
      );
    }
  }

  /** OAuth2 access token (valid ~5 min), cached and shared between concurrent callers. */
  async getAccessToken(): Promise<string> {
    this.assertConfigured();
    if (this.token && this.token.expiresAt > Date.now())
      return this.token.value;
    if (!this.tokenInflight) {
      this.tokenInflight = this.fetchToken().finally(() => {
        this.tokenInflight = null;
      });
    }
    return this.tokenInflight;
  }

  private async fetchToken(): Promise<string> {
    const c = this.cfg;
    const data = {
      client_id: c.clientId,
      client_secret: c.clientSecret,
      merchant_id: c.merchantId,
      grant_type: 'client_credentials',
    };
    const res = await this.post(`${c.apiBase}/oauth2`, {
      merchant_id: c.merchantId,
      encdata: this.encrypt(JSON.stringify(data)),
      checksum: this.checksum(data),
    });
    const accessToken = res?.data?.access_token ?? res?.access_token;
    if (!accessToken) {
      this.logger.error(
        `Airpay token request failed: ${JSON.stringify(redact(res))}`,
      );
      throw new ServiceUnavailableException(
        'Payment gateway unavailable, please try again',
      );
    }
    const ttl = Number(res?.data?.expires_in ?? res?.expires_in ?? 300);
    // Refresh a little early so a token never expires between our call and the browser's POST.
    this.token = {
      value: accessToken,
      expiresAt: Date.now() + Math.max(30, ttl - 60) * 1000,
    };
    return accessToken;
  }

  /** The hidden form the browser auto-submits to Airpay's hosted checkout. */
  async buildPaymentForm(
    order: { orderNumber: string; amount: string },
    buyer: AirpayBuyer,
  ): Promise<AirpayPaymentForm> {
    const c = this.cfg;
    const token = await this.getAccessToken();
    const data: Record<string, string> = {
      buyer_email: buyer.email,
      buyer_phone: buyer.phone,
      buyer_firstname: buyer.firstName,
      buyer_lastname: buyer.lastName,
      amount: order.amount,
      orderid: order.orderNumber,
      currency_code: '356',
      iso_currency: 'inr',
    };
    if (c.returnUrl) data.return_url = c.returnUrl;

    return {
      gateway: 'airpay',
      method: 'POST',
      url: `${c.paymentUrl}?token=${encodeURIComponent(token)}`,
      fields: {
        privatekey: this.privateKey(),
        merchant_id: c.merchantId,
        encdata: this.encrypt(JSON.stringify(data)),
        checksum: this.checksum(data),
      },
    };
  }

  /**
   * Server-to-server status check — the only thing a production payment is trusted on.
   * Returns null when Airpay has no record of the order; throws when Airpay can't be reached.
   */
  async verify(orderNumber: string): Promise<AirpayTxn | null> {
    const c = this.cfg;
    const token = await this.getAccessToken();
    const data = { orderid: orderNumber };
    const res = await this.post(
      `${c.apiBase}/verify/?token=${encodeURIComponent(token)}`,
      {
        merchant_id: c.merchantId,
        encdata: this.encrypt(JSON.stringify(data)),
        checksum: this.checksum(data),
        privatekey: this.privateKey(),
      },
    );

    const payload = Array.isArray(res?.data) ? res.data[0] : res?.data;
    if (!payload || typeof payload !== 'object') {
      if (String(res?.status_code) === '200') return null;
      // e.g. 401 token expired — drop the cached token so the next call gets a fresh one.
      this.token = null;
      throw new Error(`Airpay verify failed: ${JSON.stringify(redact(res))}`);
    }
    const txn = normalise(payload);
    return txn.orderId ? txn : null;
  }

  /**
   * Whatever Airpay sent to the return URL or the IPN URL: plain fields, JSON, or an encrypted
   * `response` field. Best effort — the result is a hint about which order to check, not proof.
   */
  parseCallback(body: any, query: any = {}): AirpayTxn | null {
    let src: any = { ...(query ?? {}), ...(body ?? {}) };
    const encrypted = src.response ?? src.encdata;
    if (typeof encrypted === 'string' && encrypted.length > 16) {
      try {
        const decoded = JSON.parse(this.decrypt(encrypted));
        src = {
          ...src,
          ...(decoded?.data && typeof decoded.data === 'object'
            ? decoded.data
            : decoded),
        };
      } catch {
        // Not encrypted with our key — fall back to the plain fields.
      }
    }
    const txn = normalise(src);
    return txn.orderId ? txn : null;
  }

  private async post(url: string, form: Record<string, string>): Promise<any> {
    const res = await axios.post(url, new URLSearchParams(form).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 20_000,
      validateStatus: () => true,
    });
    let body: any = res.data;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        /* keep as string */
      }
    }
    if (body && typeof body.response === 'string') {
      try {
        return JSON.parse(this.decrypt(body.response));
      } catch (e: any) {
        this.logger.error(
          `Airpay response could not be decrypted (${url.split('?')[0]}): ${e?.message}`,
        );
        throw new ServiceUnavailableException(
          'Payment gateway returned an unreadable response',
        );
      }
    }
    return body;
  }
}

// ── helpers ───────────────────────────────────────────────────────────

/** Field names differ between v3/v4 and between the redirect, IPN and verify payloads. */
function normalise(src: Record<string, any>): AirpayTxn {
  const lower: Record<string, any> = {};
  for (const [k, v] of Object.entries(src ?? {})) lower[k.toLowerCase()] = v;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = lower[k];
      if (v !== undefined && v !== null && v !== '') return String(v).trim();
    }
    return '';
  };
  return {
    orderId: pick('orderid', 'transactionid'),
    apTransactionId: pick('ap_transactionid', 'aptransactionid'),
    amount: pick('amount'),
    status: pick('transaction_status', 'transactionstatus'),
    paymentStatus: pick(
      'transaction_payment_status',
      'transactionpaymentstatus',
    ).toUpperCase(),
    message: pick('message'),
    chmod: pick('chmod'),
    customerVpa: pick('customer_vpa', 'customervpa'),
    merchantId: pick('merchant_id', 'mercid', 'mid'),
    secureHash: pick('ap_securehash'),
    bankName: pick('bank_name') || undefined,
    rrn: pick('rrn') || undefined,
    transactionTime: pick('transaction_time') || undefined,
  };
}

function redact(res: any) {
  if (!res || typeof res !== 'object') return res;
  const { data, ...rest } = res;
  return {
    ...rest,
    data: data && typeof data === 'object' ? '[object]' : data,
  };
}
