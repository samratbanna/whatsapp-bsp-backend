import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import {
  AdminOrderQueryDto,
  CreateOrderDto,
  MarkPaidDto,
  OrderQueryDto,
} from './dto/billing.dto';
import { AirpayService, AirpayTxn } from './gateways/airpay.service';
import { PlansService } from '../plans/plans.service';
import { planAmounts } from '../plans/schemas/plan.schema';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import {
  TransactionReason,
  WalletCategory,
} from '../wallet/schemas/wallet.schema';
import { OrgStatus } from '../../common/enums';

// Airpay transaction_status codes that mean "not settled yet — ask again later".
const IN_PROGRESS = new Set(['211', '402', '403']);
const NO_RECORD = '503';
// An order nobody paid for within this window is closed as failed.
const ABANDON_AFTER_MS = 48 * 60 * 60 * 1000;

type Source = 'return' | 'ipn' | 'poll' | 'cron' | 'admin';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly airpay: AirpayService,
    private readonly plansService: PlansService,
    private readonly orgsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
  ) {}

  // ── Checkout ───────────────────────────────────────────────────────
  async createOrder(orgId: string, userId: string, dto: CreateOrderDto) {
    if (!orgId)
      throw new ForbiddenException(
        'Only organization accounts can buy credits',
      );

    const org = await this.orgsService.findOne(orgId);
    if (org.reseller) {
      // Reseller clients get credits from their reseller, never from the website.
      const reseller = await this.orgsService
        .findOne(org.reseller.toString())
        .catch(() => null);
      throw new ForbiddenException(
        `Your account is managed by ${reseller?.name ?? 'your reseller'}. Please contact them to add credits.`,
      );
    }
    if (org.status === OrgStatus.SUSPENDED) {
      throw new ForbiddenException('Your organization is suspended');
    }

    const plan = await this.plansService.findActive(dto.plan);
    const user = await this.usersService.findOne(userId);

    const phone = digits(dto.phone || user.phone || org.phone || '');
    if (phone.length < 8 || phone.length > 15) {
      throw new BadRequestException(
        'A valid phone number is required for payment',
      );
    }
    if (!user.phone && dto.phone) {
      await this.usersService
        .update(userId, { phone: dto.phone })
        .catch(() => undefined);
    }

    const { subtotalPaise, gstPaise, totalPaise } = planAmounts(plan);
    const order = await this.createWithUniqueNumber({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      plan: plan._id,
      planSnapshot: {
        name: plan.name,
        slug: plan.slug,
        transactional: plan.transactionalCredits,
        promotional: plan.promotionalCredits,
        authentication: plan.authenticationCredits,
      },
      subtotalPaise,
      gstPercent: plan.gstPercent,
      gstPaise,
      totalPaise,
      amount: (totalPaise / 100).toFixed(2),
      buyer: { name: user.name, email: user.email, phone },
    });

    try {
      const [firstName, ...rest] = alnum(user.name).split(' ').filter(Boolean);
      const payment = await this.airpay.buildPaymentForm(order, {
        email: user.email,
        phone,
        firstName: (firstName || 'Customer').slice(0, 50),
        lastName: (rest.join(' ') || firstName || 'Customer').slice(0, 50),
      });
      this.logger.log(
        `Order ${order.orderNumber} created: org=${orgId} plan=${plan.slug} ₹${order.amount}`,
      );
      return { order: this.present(order), payment };
    } catch (e) {
      await this.orderModel.updateOne(
        { _id: order._id },
        {
          $set: {
            status: OrderStatus.FAILED,
            gatewayMessage: 'Could not start payment',
          },
        },
      );
      throw e;
    }
  }

  private async createWithUniqueNumber(
    doc: Partial<Order>,
  ): Promise<OrderDocument> {
    for (let i = 0; ; i++) {
      try {
        return await this.orderModel.create({
          ...doc,
          orderNumber: newOrderNumber(),
        });
      } catch (e: any) {
        if (e?.code !== 11000 || i >= 4) throw e;
      }
    }
  }

  // ── Org's own orders ───────────────────────────────────────────────
  async listForOrg(orgId: string, query: OrderQueryDto) {
    return this.page(
      {
        organization: new Types.ObjectId(orgId),
        ...(query.status ? { status: query.status } : {}),
      },
      query,
    );
  }

  async getForOrg(orgId: string, orderNumber: string) {
    const order = await this.orderModel.findOne({
      orderNumber,
      organization: new Types.ObjectId(orgId),
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.present(order);
  }

  /** The payment result page polls this while an order is still open. */
  async refreshForOrg(orgId: string, orderNumber: string) {
    const order = await this.orderModel.findOne({
      orderNumber,
      organization: new Types.ObjectId(orgId),
    });
    if (!order) throw new NotFoundException('Order not found');
    const recentlyChecked =
      order.lastCheckedAt &&
      Date.now() - order.lastCheckedAt.getTime() < 10_000;
    if (this.isOpen(order) && !recentlyChecked) {
      return this.present(
        (await this.confirm(orderNumber, null, 'poll')) ?? order,
      );
    }
    return this.present(order);
  }

  // ── Gateway callbacks ──────────────────────────────────────────────
  /** Browser comes back from Airpay. Returns the order number to show, if we could tell. */
  async handleReturn(body: any, query: any): Promise<string | null> {
    const hinted = this.airpay.parseCallback(body, query);
    const orderNumber =
      hinted?.orderId || (typeof query?.order === 'string' ? query.order : '');
    if (!orderNumber) {
      this.logger.warn(
        `Airpay return without an order id: keys=${Object.keys(body ?? {}).join(',')}`,
      );
      return null;
    }
    await this.confirm(orderNumber, hinted, 'return').catch((e) =>
      this.logger.error(`Airpay return ${orderNumber}: ${e?.message}`),
    );
    return orderNumber;
  }

  async handleIpn(body: any): Promise<void> {
    const hinted = this.airpay.parseCallback(body);
    if (!hinted) {
      this.logger.warn(
        `Airpay IPN without an order id: keys=${Object.keys(body ?? {}).join(',')}`,
      );
      return;
    }
    await this.confirm(hinted.orderId, hinted, 'ipn');
  }

  // ── Confirmation (the one place an order becomes paid via the gateway) ──
  /**
   * Production: ask Airpay's verify API and act only on its answer. Whatever the browser or an
   * IPN claims is used just to know which order to look up, so a forged callback can't credit
   * anything. Sandbox (verify API unavailable): accept a callback only if its ap_SecureHash
   * checks out.
   */
  async confirm(
    orderNumber: string,
    hinted: AirpayTxn | null,
    source: Source,
  ): Promise<OrderDocument | null> {
    const order = await this.orderModel.findOne({ orderNumber });
    if (!order) {
      this.logger.warn(`Airpay ${source}: unknown order ${orderNumber}`);
      return null;
    }
    if (order.status === OrderStatus.PAID) {
      await this.ensureCredits(order);
      return order;
    }

    let txn: AirpayTxn | null = null;
    if (this.airpay.isSandbox) {
      if (hinted && this.airpay.hasValidSecureHash(hinted)) txn = hinted;
      else if (hinted)
        this.logger.warn(
          `Airpay ${source} ${orderNumber}: secure hash mismatch, ignored`,
        );
    } else {
      try {
        txn = await this.airpay.verify(orderNumber);
      } catch (e: any) {
        this.logger.error(
          `Airpay verify ${orderNumber} (${source}) failed: ${e?.message}`,
        );
        await this.orderModel.updateOne(
          { _id: order._id },
          { $set: { lastCheckedAt: new Date() } },
        );
        return order;
      }
    }

    await this.orderModel.updateOne(
      { _id: order._id },
      { $set: { lastCheckedAt: new Date() } },
    );
    if (!txn) return this.closeIfAbandoned(order);
    return this.apply(order, txn, source);
  }

  private async apply(
    order: OrderDocument,
    txn: AirpayTxn,
    source: Source,
  ): Promise<OrderDocument> {
    if (txn.orderId !== order.orderNumber) {
      this.logger.error(
        `Airpay ${source}: answer for ${txn.orderId} while checking ${order.orderNumber}`,
      );
      return order;
    }

    const details = {
      ap_transactionid: txn.apTransactionId,
      transaction_status: txn.status,
      transaction_payment_status: txn.paymentStatus,
      message: txn.message,
      chmod: txn.chmod,
      amount: txn.amount,
      bank_name: txn.bankName,
      rrn: txn.rrn,
      transaction_time: txn.transactionTime,
      source,
    };
    const gatewayFields = {
      gatewayTxnId: txn.apTransactionId || order.gatewayTxnId,
      gatewayStatus: txn.status,
      gatewayMessage: txn.message,
      paymentMode: txn.chmod || order.paymentMode,
      gatewayDetails: details,
    };

    if (txn.status === '200') {
      if (toPaise(txn.amount) !== order.totalPaise) {
        this.logger.error(
          `Order ${order.orderNumber}: Airpay reports success for ₹${txn.amount}, expected ₹${order.amount} — NOT credited, needs manual review`,
        );
        return (
          (await this.orderModel.findOneAndUpdate(
            { _id: order._id, status: { $ne: OrderStatus.PAID } },
            {
              $set: {
                ...gatewayFields,
                status: OrderStatus.FAILED,
                gatewayMessage: `Amount mismatch: paid ₹${txn.amount}, expected ₹${order.amount}`,
              },
            },
            { new: true },
          )) ?? order
        );
      }

      // Conditional on "not yet paid", so concurrent return + IPN + poll mark it paid once.
      const paid = await this.orderModel.findOneAndUpdate(
        { _id: order._id, status: { $ne: OrderStatus.PAID } },
        {
          $set: {
            ...gatewayFields,
            status: OrderStatus.PAID,
            paidAt: new Date(),
            paidVia: 'gateway',
          },
        },
        { new: true },
      );
      const current = paid ?? (await this.orderModel.findById(order._id))!;
      if (paid)
        this.logger.log(
          `Order ${order.orderNumber} PAID via ${source} (₹${order.amount}, txn ${txn.apTransactionId})`,
        );
      await this.ensureCredits(current);
      if (paid) await this.activateTrialOrg(current);
      return current;
    }

    if (IN_PROGRESS.has(txn.status)) {
      return (
        (await this.orderModel.findOneAndUpdate(
          { _id: order._id, status: { $ne: OrderStatus.PAID } },
          { $set: { ...gatewayFields, status: OrderStatus.PENDING } },
          { new: true },
        )) ?? order
      );
    }

    if (txn.status === NO_RECORD || !txn.status)
      return this.closeIfAbandoned(order);

    // 400 failed, 401, 405 bounced, CANCEL/DROPPED, …
    return (
      (await this.orderModel.findOneAndUpdate(
        { _id: order._id, status: { $ne: OrderStatus.PAID } },
        { $set: { ...gatewayFields, status: OrderStatus.FAILED } },
        { new: true },
      )) ?? order
    );
  }

  private async closeIfAbandoned(order: OrderDocument): Promise<OrderDocument> {
    if (
      order.status !== OrderStatus.CREATED ||
      Date.now() - order.createdAt.getTime() < ABANDON_AFTER_MS
    ) {
      return order;
    }
    return (
      (await this.orderModel.findOneAndUpdate(
        { _id: order._id, status: OrderStatus.CREATED },
        {
          $set: {
            status: OrderStatus.FAILED,
            gatewayMessage: 'Payment not completed',
          },
        },
        { new: true },
      )) ?? order
    );
  }

  /** Load the plan's credits. Idempotent per order+category, so safe to call any number of times. */
  async ensureCredits(order: OrderDocument): Promise<void> {
    if (order.creditsAppliedAt || order.status !== OrderStatus.PAID) return;
    const orgId = order.organization.toString();
    for (const category of Object.values(WalletCategory)) {
      const credits = order.planSnapshot[category] ?? 0;
      if (credits < 1) continue;
      await this.walletService.creditOnce(orgId, {
        category,
        credits,
        reference: `order:${order.orderNumber}:${category}`,
        reason: TransactionReason.PURCHASE,
        description: `Plan "${order.planSnapshot.name}" — order ${order.orderNumber}`,
        performedBy: order.paidVia === 'manual' ? 'admin' : order.gateway,
      });
    }
    await this.orderModel.updateOne(
      { _id: order._id },
      { $set: { creditsAppliedAt: new Date() } },
    );
    order.creditsAppliedAt = new Date();
  }

  /** First successful purchase ends the trial. Never touches a suspended organization. */
  private async activateTrialOrg(order: OrderDocument) {
    const org = await this.orgsService
      .findOne(order.organization.toString())
      .catch(() => null);
    if (org?.status === OrgStatus.TRIAL) {
      await this.orgsService.activate(org._id.toString());
    }
  }

  // ── Background reconciliation ──────────────────────────────────────
  // Covers a browser that never came back and an IPN that never arrived.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcile(): Promise<void> {
    if (!this.airpay.configured) return;

    const stuck = await this.orderModel
      .find({ status: OrderStatus.PAID, creditsAppliedAt: { $exists: false } })
      .limit(50);
    for (const order of stuck) {
      await this.ensureCredits(order).catch((e) =>
        this.logger.error(
          `Reconcile credits ${order.orderNumber}: ${e?.message}`,
        ),
      );
    }

    const now = Date.now();
    const open = await this.orderModel
      .find({
        status: { $in: [OrderStatus.CREATED, OrderStatus.PENDING] },
        createdAt: { $lte: new Date(now - 5 * 60_000) },
        $or: [
          { lastCheckedAt: { $exists: false } },
          { lastCheckedAt: { $lte: new Date(now - 10 * 60_000) } },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(25);
    for (const order of open) {
      try {
        if (this.airpay.isSandbox) await this.closeIfAbandoned(order);
        else await this.confirm(order.orderNumber, null, 'cron');
      } catch (e: any) {
        this.logger.error(`Reconcile ${order.orderNumber}: ${e?.message}`);
      }
    }
  }

  // ── Super admin ────────────────────────────────────────────────────
  async listAll(query: AdminOrderQueryDto) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.orgId) filter.organization = new Types.ObjectId(query.orgId);
    return this.page(filter, query, true);
  }

  async adminVerify(orderNumber: string) {
    const order = await this.confirm(orderNumber, null, 'admin');
    if (!order) throw new NotFoundException('Order not found');
    return this.present(order, true);
  }

  /** For a payment confirmed outside the verify API (sandbox, or seen on the Airpay dashboard). */
  async markPaid(orderNumber: string, dto: MarkPaidDto, adminId: string) {
    const paid = await this.orderModel.findOneAndUpdate(
      { orderNumber, status: { $ne: OrderStatus.PAID } },
      {
        $set: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          paidVia: 'manual',
          manualNote: `${dto.note} (by ${adminId})`,
          ...(dto.gatewayTxnId ? { gatewayTxnId: dto.gatewayTxnId } : {}),
        },
      },
      { new: true },
    );
    if (!paid) {
      const exists = await this.orderModel.exists({ orderNumber });
      if (!exists) throw new NotFoundException('Order not found');
      throw new BadRequestException('Order is already paid');
    }
    this.logger.log(
      `Order ${orderNumber} marked PAID manually by ${adminId}: ${dto.note}`,
    );
    await this.ensureCredits(paid);
    await this.activateTrialOrg(paid);
    return this.present(paid, true);
  }

  // ── helpers ────────────────────────────────────────────────────────
  private isOpen(order: OrderDocument) {
    return (
      order.status === OrderStatus.CREATED ||
      order.status === OrderStatus.PENDING
    );
  }

  private async page(filter: any, query: OrderQueryDto, admin = false) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    let q = this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    if (admin) q = q.populate('organization', 'name slug');
    const [rows, total] = await Promise.all([
      q.exec(),
      this.orderModel.countDocuments(filter),
    ]);
    return {
      data: rows.map((o) => this.present(o, admin)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  present(order: OrderDocument, admin = false) {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      plan: order.planSnapshot,
      subtotal: order.subtotalPaise / 100,
      gstPercent: order.gstPercent,
      gst: order.gstPaise / 100,
      total: order.totalPaise / 100,
      amount: order.amount,
      currency: order.currency,
      gateway: order.gateway,
      gatewayTxnId: order.gatewayTxnId ?? null,
      gatewayMessage: order.gatewayMessage ?? null,
      paymentMode: order.paymentMode ?? null,
      paidAt: order.paidAt ?? null,
      creditsApplied: !!order.creditsAppliedAt,
      createdAt: order.createdAt,
      ...(admin
        ? {
            organization: order.organization,
            buyer: order.buyer,
            paidVia: order.paidVia ?? null,
            manualNote: order.manualNote ?? null,
            gatewayStatus: order.gatewayStatus ?? null,
            gatewayDetails: order.gatewayDetails ?? null,
            lastCheckedAt: order.lastCheckedAt ?? null,
          }
        : {}),
    };
  }
}

function newOrderNumber(): string {
  const d = new Date();
  const ymd =
    `${d.getUTCFullYear() % 100}`.padStart(2, '0') +
    `${d.getUTCMonth() + 1}`.padStart(2, '0') +
    `${d.getUTCDate()}`.padStart(2, '0');
  // 'WB' + yymmdd + 10 random base-36 chars = 18 alphanumerics (Airpay allows ≤ 30).
  const rand = BigInt('0x' + randomBytes(8).toString('hex'))
    .toString(36)
    .toUpperCase()
    .padStart(10, '0')
    .slice(-10);
  return `WB${ymd}${rand}`;
}

function digits(s: string): string {
  return s.replace(/\D/g, '');
}

function alnum(s: string): string {
  return (s || '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "2358.82" → 235882. Rounds, so "2358.8" and "2358.820" compare equal. */
function toPaise(amount: string): number {
  const n = Number(amount);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}
