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
  BalancePurchaseDto,
  CreateOrderDto,
  MarkPaidDto,
  OrderQueryDto,
  PageQueryDto,
  SalesQueryDto,
} from './dto/billing.dto';
import { AirpayService, AirpayTxn } from './gateways/airpay.service';
import { RatesService } from '../rates/rates.service';
import {
  LABEL,
  PricedItem,
  describeItems,
  priceItems,
  rupees,
  totals,
} from '../rates/rates.util';
import { OrganizationsService } from '../organizations/organizations.service';
import { OrganizationDocument } from '../organizations/schemas/organization.schema';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import {
  BalanceReason,
  TransactionReason,
} from '../wallet/schemas/wallet.schema';
import { OrgStatus } from '../../common/enums';

// Airpay transaction_status codes that mean "not settled yet — ask again later".
const IN_PROGRESS = new Set(['211', '402', '403']);
const NO_RECORD = '503';
// An order nobody paid for within this window is closed as failed.
const ABANDON_AFTER_MS = 48 * 60 * 60 * 1000;
// A balance purchase finishes inside one request; one still open after this was interrupted.
const BALANCE_STUCK_MS = 15 * 60 * 1000;

type Source = 'return' | 'ipn' | 'poll' | 'cron' | 'admin';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly airpay: AirpayService,
    private readonly ratesService: RatesService,
    private readonly orgsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
  ) {}

  // ── What this organization pays, and how it pays ─────────────────
  async myRates(orgId: string) {
    if (!orgId)
      throw new ForbiddenException(
        'Only organization accounts can buy credits',
      );
    const org = await this.orgsService.findOne(orgId);
    const settings = await this.ratesService.getSettings();
    const { rates } = await this.ratesService.effectiveRates(org, settings);

    if (!org.reseller) {
      return {
        channel: 'airpay' as const,
        rates,
        gstPercent: settings.gstPercent,
        minPurchase: settings.minPurchase,
      };
    }
    const reseller = await this.orgsService
      .findOne(org.reseller.toString())
      .catch(() => null);
    return {
      channel: 'balance' as const,
      rates,
      gstPercent: settings.gstPercent,
      balance: (await this.walletService.getBalance(orgId)) / 100,
      seller: { name: reseller?.name ?? 'your reseller' },
    };
  }

  // ── Online checkout (direct customers and resellers) ──────────────
  async createOrder(orgId: string, userId: string, dto: CreateOrderDto) {
    if (!orgId)
      throw new ForbiddenException(
        'Only organization accounts can buy credits',
      );

    const org = await this.orgsService.findOne(orgId);
    if (org.reseller) {
      // Reseller clients pay their reseller and buy from the balance it loads.
      const reseller = await this.orgsService
        .findOne(org.reseller.toString())
        .catch(() => null);
      throw new ForbiddenException(
        `Your account is managed by ${reseller?.name ?? 'your reseller'}. Buy from your balance, or contact them to add balance.`,
      );
    }
    if (org.status === OrgStatus.SUSPENDED) {
      throw new ForbiddenException('Your organization is suspended');
    }

    const settings = await this.ratesService.getSettings();
    const { rates } = await this.ratesService.effectiveRates(org, settings);
    const items = priceItems(rates, dto.items);
    const { subtotalPaise, gstPaise, totalPaise } = totals(
      items,
      settings.gstPercent,
    );
    if (subtotalPaise < Math.round(settings.minPurchase * 100)) {
      throw new BadRequestException(
        `Minimum purchase is ${rupees(Math.round(settings.minPurchase * 100))} before GST. This order is ${rupees(subtotalPaise)}.`,
      );
    }

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

    const order = await this.createWithUniqueNumber({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      items,
      subtotalPaise,
      gstPercent: settings.gstPercent,
      gstPaise,
      totalPaise,
      amount: (totalPaise / 100).toFixed(2),
      gateway: 'airpay',
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
        `Order ${order.orderNumber} created: org=${orgId} ${describeItems(items)} ₹${order.amount}`,
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

  // ── Balance purchase (reseller clients) ────────────────────────────
  /**
   * The client pays from the balance its reseller loaded, at the rates the reseller set; the
   * messages come out of the reseller's own credits. Without Mongo transactions the steps run in
   * order and each failure undoes the steps before it: take the money, move each category's
   * credits, mark paid. The order records progress, so an interrupted purchase is visible.
   */
  async buyWithBalance(orgId: string, userId: string, dto: BalancePurchaseDto) {
    if (!orgId)
      throw new ForbiddenException(
        'Only organization accounts can buy credits',
      );
    const org = await this.orgsService.findOne(orgId);
    if (!org.reseller) {
      throw new ForbiddenException(
        'Pay online to buy messages — balance purchases are for accounts managed by a reseller',
      );
    }
    if (org.status === OrgStatus.SUSPENDED) {
      throw new ForbiddenException('Your organization is suspended');
    }
    const reseller = await this.orgsService.findOne(org.reseller.toString());
    if (reseller.status === OrgStatus.SUSPENDED) {
      throw new ForbiddenException(
        `Purchases are paused. Please contact ${reseller.name}.`,
      );
    }
    const organization = new Types.ObjectId(orgId);

    if (dto.requestId) {
      const prior = await this.orderModel.findOne({
        organization,
        idempotencyKey: dto.requestId,
      });
      if (prior) return this.balanceResult(prior, orgId);
    }

    const settings = await this.ratesService.getSettings();
    const [{ rates }, { rates: costRates }] = await Promise.all([
      this.ratesService.effectiveRates(org, settings),
      this.ratesService.effectiveRates(reseller, settings),
    ]);
    const items = priceItems(rates, dto.items).map((i) => ({
      ...i,
      ...(costRates[i.category] != null
        ? { costRatePaise: costRates[i.category]! }
        : {}),
    }));
    const { subtotalPaise, gstPaise, totalPaise } = totals(
      items,
      settings.gstPercent,
    );
    const costPaise = items.every((i) => i.costRatePaise != null)
      ? items.reduce(
          (s, i) =>
            s +
            Math.round((i.quantity * Math.round(i.costRatePaise! * 100)) / 100),
          0,
        )
      : undefined;

    // Friendly checks first; the conditional updates below are what actually guard the balances.
    const resellerId = reseller._id.toString();
    const stock = await this.walletService.getCredits(resellerId);
    const short = items.filter((i) => stock[i.category] < i.quantity);
    if (short.length) {
      throw new BadRequestException(
        `${short.map((i) => LABEL[i.category]).join(' and ')} messages are not available in that quantity right now. Please contact ${reseller.name}.`,
      );
    }
    const balance = await this.walletService.getBalance(orgId);
    if (balance < totalPaise) {
      throw new BadRequestException(
        `Insufficient balance: you have ${rupees(balance)}, this purchase needs ${rupees(totalPaise)}. Ask ${reseller.name} to add balance.`,
      );
    }

    let order: OrderDocument;
    try {
      order = await this.createWithUniqueNumber({
        organization,
        user: new Types.ObjectId(userId),
        items,
        subtotalPaise,
        gstPercent: settings.gstPercent,
        gstPaise,
        totalPaise,
        amount: (totalPaise / 100).toFixed(2),
        gateway: 'balance',
        seller: reseller._id as Types.ObjectId,
        ...(costPaise != null ? { costPaise } : {}),
        ...(dto.requestId ? { idempotencyKey: dto.requestId } : {}),
      });
    } catch (e: any) {
      if (e?.code === 11000 && dto.requestId) {
        const prior = await this.orderModel.findOne({
          organization,
          idempotencyKey: dto.requestId,
        });
        if (prior) return this.balanceResult(prior, orgId);
      }
      throw e;
    }
    const no = order.orderNumber;
    const fail = (message: string) =>
      this.orderModel.updateOne(
        { _id: order._id },
        { $set: { status: OrderStatus.FAILED, gatewayMessage: message } },
      );

    // 1. Take the money.
    try {
      await this.walletService.changeBalance(orgId, {
        direction: 'debit',
        amountPaise: totalPaise,
        reason: BalanceReason.PURCHASE,
        reference: `order:${no}`,
        counterparty: resellerId,
        description: `Bought ${describeItems(items)} messages — order ${no}`,
        performedBy: userId,
      });
    } catch (e: any) {
      await fail(e?.message ?? 'Balance could not be charged');
      throw e;
    }
    await this.orderModel.updateOne(
      { _id: order._id },
      { $set: { balanceDebitedAt: new Date() } },
    );

    // 2. Move the credits from the reseller to the client, one category at a time.
    const moved: PricedItem[] = [];
    try {
      for (const item of items) {
        await this.walletService.transferCredits(resellerId, orgId, {
          category: item.category,
          credits: item.quantity,
          performedBy: userId,
          netAddedOn: 'receiver',
          fromDescription: `Sold ${item.quantity} ${item.category} credits to ${org.name} @ ${item.ratePaise}p — order ${no}`,
          toDescription: `Bought ${item.quantity} ${item.category} credits @ ${item.ratePaise}p — order ${no}`,
        });
        moved.push(item);
      }
    } catch (e: any) {
      this.logger.warn(
        `Balance order ${no}: credit move failed (${e?.message}) — undoing`,
      );
      for (const item of moved) {
        await this.walletService
          .transferCredits(orgId, resellerId, {
            category: item.category,
            credits: item.quantity,
            performedBy: 'system',
            netAddedOn: 'sender',
            fromDescription: `Reversed — order ${no} could not be completed`,
            toDescription: `Returned from ${org.name} — order ${no} could not be completed`,
          })
          .catch((err: any) =>
            this.logger.error(
              `Balance order ${no}: could not return ${item.quantity} ${item.category} to reseller ${resellerId}: ${err?.message}`,
            ),
          );
      }
      await this.walletService
        .changeBalance(orgId, {
          direction: 'credit',
          amountPaise: totalPaise,
          reason: BalanceReason.REFUND,
          reference: `refund:${no}`,
          counterparty: resellerId,
          description: `Refund — order ${no} could not be completed`,
          performedBy: 'system',
        })
        .catch((err: any) =>
          this.logger.error(
            `Balance order ${no}: REFUND FAILED, ${rupees(totalPaise)} owed to org ${orgId}: ${err?.message}`,
          ),
        );
      await fail(
        'Messages were not available; the amount was refunded to your balance',
      );
      throw new BadRequestException(
        `Those messages are not available right now and nothing was charged. Please contact ${reseller.name}.`,
      );
    }

    // 3. Done.
    const paid = (await this.orderModel.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          paidVia: 'balance',
          creditsAppliedAt: new Date(),
        },
      },
      { new: true },
    ))!;
    this.logger.log(
      `Balance order ${no} PAID: client=${orgId} reseller=${resellerId} ${describeItems(items)} ${rupees(totalPaise)}`,
    );
    return this.balanceResult(paid, orgId);
  }

  private async balanceResult(order: OrderDocument, orgId: string) {
    const credits = await this.walletService.getCredits(orgId);
    return { order: this.present(order), balance: credits.balance, credits };
  }

  async balanceHistory(orgId: string, query: PageQueryDto) {
    return this.walletService.getBalanceTransactions(orgId, query);
  }

  // ── Reseller: what its clients bought ──────────────────────────────
  async listSales(resellerId: string, query: SalesQueryDto) {
    const filter: any = { seller: new Types.ObjectId(resellerId) };
    if (query.clientId)
      filter.organization = new Types.ObjectId(query.clientId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const [rows, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('organization', 'name slug')
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);
    return {
      data: rows.map((o) => this.presentSale(o)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /** Paid client purchases: all time and this calendar month (IST). */
  async salesSummary(resellerId: string) {
    const monthStart = istMonthStart();
    const [row] = await this.orderModel.aggregate([
      {
        $match: {
          seller: new Types.ObjectId(resellerId),
          status: OrderStatus.PAID,
        },
      },
      {
        $facet: {
          all: [{ $group: groupSales() }],
          month: [
            { $match: { paidAt: { $gte: monthStart } } },
            { $group: groupSales() },
          ],
        },
      },
    ]);
    const shape = (g: any) => ({
      orders: g?.orders ?? 0,
      sales: (g?.sales ?? 0) / 100,
      cost: (g?.cost ?? 0) / 100,
      margin: ((g?.sales ?? 0) - (g?.cost ?? 0)) / 100,
    });
    return { allTime: shape(row?.all?.[0]), thisMonth: shape(row?.month?.[0]) };
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
        // Retry only an order-number clash; a repeated idempotency key is the caller's to handle.
        if (e?.code !== 11000 || e?.keyPattern?.idempotencyKey || i >= 4)
          throw e;
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
    if (order.gateway === 'balance') return order; // never went through Airpay
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

  /** Load the order's credits. Idempotent per order+category, so safe to call any number of times. */
  async ensureCredits(order: OrderDocument): Promise<void> {
    if (order.creditsAppliedAt || order.status !== OrderStatus.PAID) return;
    if (order.gateway === 'balance') return; // moved from the reseller at purchase time
    const orgId = order.organization.toString();
    for (const item of order.items) {
      if (item.quantity < 1) continue;
      await this.walletService.creditOnce(orgId, {
        category: item.category,
        credits: item.quantity,
        reference: `order:${order.orderNumber}:${item.category}`,
        reason: TransactionReason.PURCHASE,
        description: `Bought ${item.quantity} ${item.category} credits @ ${item.ratePaise}p — order ${order.orderNumber}`,
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
    await this.reconcileBalanceOrders().catch((e) =>
      this.logger.error(`Reconcile balance orders: ${e?.message}`),
    );
    if (!this.airpay.configured) return;

    const stuck = await this.orderModel
      .find({
        status: OrderStatus.PAID,
        gateway: { $ne: 'balance' },
        creditsAppliedAt: { $exists: false },
      })
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
        gateway: { $ne: 'balance' },
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

  /**
   * A balance purchase still open long after it started was cut off mid-way (process restart).
   * Nothing charged → just close it. Charged → flag it for a person to finish or refund; guessing
   * which credits moved would risk paying twice.
   */
  private async reconcileBalanceOrders() {
    const open = await this.orderModel
      .find({
        gateway: 'balance',
        status: OrderStatus.CREATED,
        createdAt: { $lte: new Date(Date.now() - BALANCE_STUCK_MS) },
      })
      .limit(25);
    for (const order of open) {
      const charged =
        !!order.balanceDebitedAt ||
        (await this.walletService.hasBalanceEntry(
          order.organization.toString(),
          `order:${order.orderNumber}`,
        ));
      if (!charged) {
        await this.orderModel.updateOne(
          { _id: order._id, status: OrderStatus.CREATED },
          {
            $set: {
              status: OrderStatus.FAILED,
              gatewayMessage: 'Not completed',
            },
          },
        );
        continue;
      }
      this.logger.error(
        `Balance order ${order.orderNumber} was interrupted after charging ${rupees(order.totalPaise)} — needs manual review`,
      );
      await this.orderModel.updateOne(
        { _id: order._id, status: OrderStatus.CREATED },
        {
          $set: {
            status: OrderStatus.PENDING,
            gatewayMessage:
              'Interrupted after the balance was charged — needs manual review',
          },
        },
      );
    }
  }

  // ── Super admin ────────────────────────────────────────────────────
  async listAll(query: AdminOrderQueryDto) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.orgId) filter.organization = new Types.ObjectId(query.orgId);
    if (query.gateway === 'balance') filter.gateway = 'balance';
    if (query.gateway === 'airpay') filter.gateway = { $ne: 'balance' };
    return this.page(filter, query, true);
  }

  async adminVerify(orderNumber: string) {
    const order = await this.confirm(orderNumber, null, 'admin');
    if (!order) throw new NotFoundException('Order not found');
    return this.present(order, true);
  }

  /** For a payment confirmed outside the verify API (sandbox, or seen on the Airpay dashboard). */
  async markPaid(orderNumber: string, dto: MarkPaidDto, adminId: string) {
    const existing = await this.orderModel.findOne({ orderNumber });
    if (!existing) throw new NotFoundException('Order not found');
    if (existing.gateway === 'balance') {
      throw new BadRequestException(
        'Balance purchases are not paid online and cannot be marked paid',
      );
    }
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
    if (!paid) throw new BadRequestException('Order is already paid');
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
    if (admin)
      q = q
        .populate('organization', 'name slug')
        .populate('seller', 'name slug');
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
      items: (order.items ?? []).map((i) => ({
        category: i.category,
        quantity: i.quantity,
        rate: i.ratePaise, // paise per message
        amount: i.amountPaise / 100,
        ...(admin && i.costRatePaise != null
          ? { costRate: i.costRatePaise }
          : {}),
      })),
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
            seller: order.seller ?? null,
            cost: order.costPaise != null ? order.costPaise / 100 : null,
            buyer: order.buyer ?? null,
            paidVia: order.paidVia ?? null,
            manualNote: order.manualNote ?? null,
            gatewayStatus: order.gatewayStatus ?? null,
            gatewayDetails: order.gatewayDetails ?? null,
            lastCheckedAt: order.lastCheckedAt ?? null,
          }
        : {}),
    };
  }

  /** A client purchase as its reseller sees it: what the client paid, what it cost, the margin. */
  presentSale(order: OrderDocument) {
    const base = this.present(order);
    const cost = order.costPaise != null ? order.costPaise / 100 : null;
    return {
      ...base,
      client: order.organization,
      items: (order.items ?? []).map((i) => ({
        category: i.category,
        quantity: i.quantity,
        rate: i.ratePaise,
        amount: i.amountPaise / 100,
        costRate: i.costRatePaise ?? null,
      })),
      cost,
      margin:
        cost != null
          ? Math.round(order.subtotalPaise - order.costPaise!) / 100
          : null,
    };
  }
}

function groupSales() {
  return {
    _id: null,
    orders: { $sum: 1 },
    sales: { $sum: '$subtotalPaise' },
    cost: { $sum: { $ifNull: ['$costPaise', 0] } },
  };
}

/** First instant of the current month in India. */
function istMonthStart(now = new Date()): Date {
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - 5.5 * 3600_000,
  );
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
