import {
  Injectable, BadRequestException, Logger, InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  Wallet, WalletDocument,
  WalletTransaction, WalletTransactionDocument,
  WalletCategory, TransactionType, TransactionReason,
} from './schemas/wallet.schema';
import {
  AddCreditsDto, BulkAddCreditsDto,
  DeductCreditsDto, PartnerTopupDto,
  UpdateWalletSettingsDto, WalletTxQueryDto,
} from './dto/wallet.dto';

export type CreditBalances = Record<WalletCategory, number>;

export interface CreditOnceInput {
  category: WalletCategory;
  credits: number;
  reference: string;
  reason: TransactionReason;
  description?: string;
  performedBy: string;
}

export interface TransferInput {
  category: WalletCategory;
  credits: number;
  performedBy: string;
  fromDescription: string;
  toDescription: string;
  /**
   * Which side's lifetime "added" total reflects the move. A reseller allocating to a client
   * counts as credits added for the client ('receiver'); taking them back undoes that on the
   * client ('sender'). The reseller's own lifetime totals stay about what it bought and used.
   */
  netAddedOn: 'receiver' | 'sender';
}

/**
 * Every balance change is a single atomic `$inc` on the wallet document. Message sends,
 * refunds, admin top-ups and reseller transfers can hit one wallet at the same time (a reseller
 * moving credits while its own campaign is running), and a read-modify-save would let one of
 * them overwrite the other.
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name) private txModel: Model<WalletTransactionDocument>,
  ) { }

  // ── Get or create wallet ───────────────────────────────────────────
  async getOrCreate(orgId: string): Promise<WalletDocument> {
    let wallet = await this.walletModel.findOne({
      organization: new Types.ObjectId(orgId),
    });
    if (!wallet) {
      try {
        wallet = await this.walletModel.create({
          organization: new Types.ObjectId(orgId),
        });
      } catch (e: any) {
        // Two first-time callers raced on the unique index — the other one created it.
        if (e?.code !== 11000) throw e;
        wallet = await this.walletModel.findOne({ organization: new Types.ObjectId(orgId) });
        if (!wallet) throw e;
      }
    }
    return wallet;
  }

  // ── Initialize wallet on org creation ──────────────────────────────
  async initializeForOrg(orgId: string): Promise<WalletDocument> {
    const wallet = await this.getOrCreate(orgId);
    this.logger.log(`Wallet initialized for org=${orgId}`);
    return wallet;
  }

  // ── Get credits summary ────────────────────────────────────────────
  async getCredits(orgId: string) {
    const wallet = await this.getOrCreate(orgId);
    return {
      transactional: wallet.transactional,
      promotional: wallet.promotional,
      authentication: wallet.authentication,
      blockOnEmpty: wallet.blockOnEmpty,
      thresholds: {
        transactional: wallet.lowTransactionalThreshold,
        promotional: wallet.lowPromotionalThreshold,
        authentication: wallet.lowAuthenticationThreshold,
      },
    };
  }

  // ── Balances for many orgs at once (reseller client list) ──────────
  async getBalancesForOrgs(orgIds: string[]): Promise<Map<string, CreditBalances>> {
    const rows = await this.walletModel
      .find({ organization: { $in: orgIds.map((id) => new Types.ObjectId(id)) } })
      .select('organization transactional promotional authentication')
      .lean()
      .exec();
    const out = new Map<string, CreditBalances>();
    for (const r of rows as any[]) {
      out.set(r.organization.toString(), {
        transactional: r.transactional ?? 0,
        promotional: r.promotional ?? 0,
        authentication: r.authentication ?? 0,
      });
    }
    return out;
  }

  // ── Add credits (super admin) ──────────────────────────────────────
  async addCredits(
    orgId: string,
    dto: AddCreditsDto,
    adminId: string,
  ): Promise<{ wallet: WalletDocument; transaction: WalletTransactionDocument }> {
    const organization = new Types.ObjectId(orgId);
    const f = fieldsFor(dto.category);
    await this.getOrCreate(orgId);

    const wallet = (await this.walletModel.findOneAndUpdate(
      { organization },
      {
        $inc: { [f.balance]: dto.credits, [f.added]: dto.credits },
        $set: { [f.alert]: false }, // reset alert flag on top-up
      },
      { new: true },
    ))!;
    const creditsAfter = wallet[dto.category] as number;

    const transaction = await this.txModel.create({
      organization,
      wallet: wallet._id,
      type: TransactionType.CREDIT,
      reason: dto.reason,
      category: dto.category,
      credits: dto.credits,
      creditsBefore: creditsAfter - dto.credits,
      creditsAfter,
      description: dto.description || `${dto.credits} ${dto.category} credits added`,
      performedBy: adminId,
    });

    this.logger.log(
      `Credits added: org=${orgId} cat=${dto.category} +${dto.credits} → ${creditsAfter}`,
    );
    return { wallet, transaction };
  }

  // ── Deduct credits (super admin manual adjustment) ─────────────────
  async deductCreditsAdmin(
    orgId: string,
    dto: DeductCreditsDto,
    adminId: string,
  ): Promise<{ wallet: WalletDocument; transaction: WalletTransactionDocument }> {
    const organization = new Types.ObjectId(orgId);
    const f = fieldsFor(dto.category);
    await this.getOrCreate(orgId);

    const wallet = await this.walletModel.findOneAndUpdate(
      { organization, [f.balance]: { $gte: dto.credits } },
      { $inc: { [f.balance]: -dto.credits, [f.used]: dto.credits } },
      { new: true },
    );
    if (!wallet) {
      const current = await this.getOrCreate(orgId);
      throw new BadRequestException(
        `Cannot deduct ${dto.credits} from ${dto.category}. Current balance: ${current[dto.category]}.`,
      );
    }
    const creditsAfter = wallet[dto.category] as number;

    const transaction = await this.txModel.create({
      organization,
      wallet: wallet._id,
      type: TransactionType.DEBIT,
      reason: TransactionReason.ADJUSTMENT,
      category: dto.category,
      credits: dto.credits,
      creditsBefore: creditsAfter + dto.credits,
      creditsAfter,
      description: dto.description || `Admin deducted ${dto.credits} ${dto.category} credits`,
      performedBy: adminId,
    });

    this.logger.log(
      `Credits deducted by admin: org=${orgId} cat=${dto.category} -${dto.credits} → ${creditsAfter} by=${adminId}`,
    );
    return { wallet, transaction };
  }

  // ── Bulk add across categories (convenience) ───────────────────────
  async bulkAddCredits(
    orgId: string,
    dto: BulkAddCreditsDto,
    adminId: string,
  ): Promise<WalletDocument> {
    for (const category of Object.values(WalletCategory)) {
      const credits = dto[category];
      if (credits) {
        await this.addCredits(orgId, {
          category,
          credits,
          reason: TransactionReason.ADMIN_TOPUP,
          description: dto.description,
        }, adminId);
      }
    }
    return this.getOrCreate(orgId);
  }

  // ── Credit exactly once per reference (idempotent) ─────────────────
  // Used by partner top-ups and website plan purchases. Both arrive from systems that retry
  // until they hear back, so the same `reference` may arrive many times, concurrently, or after a
  // timeout that actually succeeded — it must credit exactly once. The balance increment and the
  // reference are one atomic update on the wallet document, so that holds without a Mongo
  // transaction.
  async creditOnce(
    orgId: string,
    input: CreditOnceInput,
  ): Promise<{ duplicate: boolean; transaction: WalletTransactionDocument | null }> {
    const organization = new Types.ObjectId(orgId);
    const { category, credits, reference } = input;
    const f = fieldsFor(category);

    // Permanent record first: a reference that is already in the ledger is done.
    const existing = await this.txModel.findOne({ organization, reference });
    if (existing) return { duplicate: true, transaction: existing };

    await this.getOrCreate(orgId);
    const updated = await this.walletModel.findOneAndUpdate(
      { organization, topupRefs: { $ne: reference } },
      {
        $inc: { [f.balance]: credits, [f.added]: credits },
        $set: { [f.alert]: false },
        // Bounded: the ledger row below is the long-term record; this only has to cover the
        // gap between the increment and that row being written.
        $push: { topupRefs: { $each: [reference], $slice: -200 } },
      },
      { new: true },
    );

    if (!updated) {
      // Another request with this reference won the update.
      const tx = await this.txModel.findOne({ organization, reference });
      return { duplicate: true, transaction: tx };
    }

    const creditsAfter = updated[category] as number;
    let transaction: WalletTransactionDocument | null = null;
    try {
      transaction = await this.txModel.create({
        organization,
        wallet: updated._id,
        type: TransactionType.CREDIT,
        reason: input.reason,
        category,
        credits,
        creditsBefore: creditsAfter - credits,
        creditsAfter,
        reference,
        description: input.description || `${credits} ${category} credits purchased`,
        performedBy: input.performedBy,
      });
    } catch (e: any) {
      // The credits are in. A missing ledger row is a reporting gap, not a reason to fail the
      // call — failing would make the caller retry, and the retry is (correctly) a no-op.
      this.logger.error(
        `Credit ${reference}: credits added but ledger row not written: ${e?.message}`,
      );
    }

    this.logger.log(
      `Credit once: org=${orgId} cat=${category} +${credits} → ${creditsAfter} ref=${reference}`,
    );
    return { duplicate: false, transaction };
  }

  // ── Partner top-up (server-to-server, idempotent) ──────────────────
  // A partner (Swaad Boss) sells credit packs to its customers and loads them here once the
  // customer has paid.
  async partnerTopup(
    orgId: string,
    dto: PartnerTopupDto,
  ): Promise<{
    duplicate: boolean;
    transaction: WalletTransactionDocument | null;
    credits: Awaited<ReturnType<WalletService['getCredits']>>;
  }> {
    const result = await this.creditOnce(orgId, {
      category: dto.category,
      credits: dto.credits,
      reference: dto.reference,
      reason: TransactionReason.PURCHASE,
      description: dto.description,
      performedBy: 'partner',
    });
    return { ...result, credits: await this.getCredits(orgId) };
  }

  // ── Move credits between two wallets (reseller ⇄ client) ───────────
  // The sender's debit is conditional on its balance, so two transfers racing each other (or a
  // transfer racing the sender's own message sends) can never take the balance below zero.
  async transferCredits(
    fromOrgId: string,
    toOrgId: string,
    input: TransferInput,
  ): Promise<{ transferId: string; from: CreditBalances; to: CreditBalances }> {
    const { category, credits } = input;
    if (fromOrgId === toOrgId) throw new BadRequestException('Cannot transfer credits to the same wallet');
    if (!Number.isInteger(credits) || credits < 1) {
      throw new BadRequestException('credits must be a positive whole number');
    }

    const fromOrg = new Types.ObjectId(fromOrgId);
    const toOrg = new Types.ObjectId(toOrgId);
    const f = fieldsFor(category);
    await Promise.all([this.getOrCreate(fromOrgId), this.getOrCreate(toOrgId)]);

    const senderInc: Record<string, number> = { [f.balance]: -credits };
    const receiverInc: Record<string, number> = { [f.balance]: credits };
    if (input.netAddedOn === 'receiver') receiverInc[f.added] = credits;
    else senderInc[f.added] = -credits;

    // 1. Debit the sender — only if it has enough.
    const from = await this.walletModel.findOneAndUpdate(
      { organization: fromOrg, [f.balance]: { $gte: credits } },
      { $inc: senderInc },
      { new: true },
    );
    if (!from) {
      const current = await this.getOrCreate(fromOrgId);
      throw new BadRequestException(
        `Insufficient ${category} credits. Available: ${current[category]}, requested: ${credits}.`,
      );
    }

    // 2. Credit the receiver; if that fails, put the sender's credits back.
    let to: WalletDocument | null = null;
    try {
      to = await this.walletModel.findOneAndUpdate(
        { organization: toOrg },
        { $inc: receiverInc, $set: { [f.alert]: false } },
        { new: true },
      );
      if (!to) throw new Error('receiver wallet not found');
    } catch (e: any) {
      const undo: Record<string, number> = {};
      for (const [k, v] of Object.entries(senderInc)) undo[k] = -v;
      await this.walletModel
        .updateOne({ organization: fromOrg }, { $inc: undo })
        .catch((err: any) =>
          this.logger.error(
            `Transfer ${fromOrgId}→${toOrgId}: receiver credit failed AND sender refund failed — ` +
            `${credits} ${category} credits must be restored to ${fromOrgId} by hand: ${err?.message}`,
          ),
        );
      this.logger.error(`Transfer ${fromOrgId}→${toOrgId} failed: ${e?.message}`);
      throw new InternalServerErrorException('Transfer failed, no credits were moved. Please retry.');
    }

    // 3. Ledger: one row per side, linked by transferId.
    const transferId = randomUUID();
    const fromAfter = from[category] as number;
    const toAfter = to[category] as number;
    try {
      await this.txModel.insertMany([
        {
          organization: fromOrg,
          wallet: from._id,
          type: TransactionType.DEBIT,
          reason: TransactionReason.TRANSFER,
          category,
          credits,
          creditsBefore: fromAfter + credits,
          creditsAfter: fromAfter,
          counterparty: toOrg,
          transferId,
          description: input.fromDescription,
          performedBy: input.performedBy,
        },
        {
          organization: toOrg,
          wallet: to._id,
          type: TransactionType.CREDIT,
          reason: TransactionReason.TRANSFER,
          category,
          credits,
          creditsBefore: toAfter - credits,
          creditsAfter: toAfter,
          counterparty: fromOrg,
          transferId,
          description: input.toDescription,
          performedBy: input.performedBy,
        },
      ]);
    } catch (e: any) {
      // Same trade-off as creditOnce: the move happened; the ledger gap is logged, not thrown.
      this.logger.error(`Transfer ${transferId}: credits moved but ledger rows not written: ${e?.message}`);
    }

    this.logger.log(
      `Transfer ${transferId}: ${fromOrgId} → ${toOrgId} cat=${category} ${credits} by=${input.performedBy}`,
    );
    return { transferId, from: balancesOf(from), to: balancesOf(to) };
  }

  // ── Transfer totals for a reseller (what it handed out / took back) ─
  async getTransferTotals(orgId: string) {
    const rows = await this.txModel.aggregate([
      { $match: { organization: new Types.ObjectId(orgId), reason: TransactionReason.TRANSFER } },
      { $group: { _id: { type: '$type', category: '$category' }, credits: { $sum: '$credits' } } },
    ]);
    const empty = (): CreditBalances => ({ transactional: 0, promotional: 0, authentication: 0 });
    const allocated = empty();
    const revoked = empty();
    for (const r of rows) {
      const bucket = r._id.type === TransactionType.DEBIT ? allocated : revoked;
      bucket[r._id.category as WalletCategory] = r.credits;
    }
    return { allocated, revoked };
  }

  // ── KEY: Deduct 1 credit on message send ──────────────────────────
  // Returns the created transaction so callers can later link the metaMessageId
  // via linkMetaMessageId() once Meta confirms the send.
  async deductCredit(
    orgId: string,
    category: WalletCategory,
    messageId?: string,
    campaignId?: string,
    metaMessageId?: string,
  ): Promise<WalletTransactionDocument> {
    const organization = new Types.ObjectId(orgId);
    const f = fieldsFor(category);

    let wallet = await this.walletModel.findOneAndUpdate(
      { organization, [f.balance]: { $gte: 1 } },
      { $inc: { [f.balance]: -1, [f.used]: 1 } },
      { new: true },
    );
    const debited = !!wallet;

    if (!wallet) {
      // Empty, or no wallet yet.
      const current = await this.getOrCreate(orgId);
      if (current.blockOnEmpty) {
        throw new BadRequestException(
          `Insufficient ${category} message credits. Current: ${current[category]}. Please contact admin to top up.`,
        );
      }
      // blockOnEmpty off: the send goes ahead at zero balance; only usage is counted.
      wallet = (await this.walletModel.findOneAndUpdate(
        { organization },
        { $inc: { [f.used]: 1 } },
        { new: true },
      ))!;
    }

    const creditsAfter = wallet[category] as number;
    const tx = await this.txModel.create({
      organization,
      wallet: wallet._id,
      type: TransactionType.DEBIT,
      reason: TransactionReason.MESSAGE_USE,
      category,
      credits: 1,
      creditsBefore: debited ? creditsAfter + 1 : creditsAfter,
      creditsAfter,
      message: messageId ? new Types.ObjectId(messageId) : undefined,
      campaign: campaignId ? new Types.ObjectId(campaignId) : undefined,
      metaMessageId,
      description: `1 ${category} credit used`,
    });

    // Low credits alert — flip the flag atomically so only one send logs it.
    const threshold = (wallet as any)[f.threshold] as number;
    if (creditsAfter <= threshold && !(wallet as any)[f.alert]) {
      const flipped = await this.walletModel.updateOne(
        { organization, [f.alert]: { $ne: true } },
        { $set: { [f.alert]: true } },
      );
      if (flipped.modifiedCount) {
        this.logger.warn(`Low credits alert: org=${orgId} cat=${category} remaining=${creditsAfter}`);
        // TODO: emit email/push notification
      }
    }

    return tx;
  }

  // ── Link wamid to debit transaction after Meta confirms send ───────
  async linkMetaMessageId(txId: string, metaMessageId: string): Promise<void> {
    await this.txModel.findByIdAndUpdate(txId, { metaMessageId });
  }

  // ── Refund 1 credit on Meta delivery failure ───────────────────────
  async refundCredit(
    orgId: string,
    metaMessageId: string,
    failureReason: string,
  ): Promise<void> {
    const organization = new Types.ObjectId(orgId);

    // Find original debit
    const original = await this.txModel.findOne({
      organization,
      metaMessageId,
      type: TransactionType.DEBIT,
      reason: TransactionReason.MESSAGE_USE,
    });
    if (!original) return;

    // Already refunded?
    const exists = await this.txModel.findOne({
      organization,
      metaMessageId,
      type: TransactionType.REFUND,
    });
    if (exists) return;

    const category = original.category;
    const f = fieldsFor(category);
    const wallet = await this.walletModel.findOneAndUpdate(
      { organization },
      { $inc: { [f.balance]: 1, [f.used]: -1 } },
      { new: true },
    );
    if (!wallet) return;
    const creditsAfter = wallet[category] as number;

    await this.txModel.create({
      organization,
      wallet: wallet._id,
      type: TransactionType.REFUND,
      reason: TransactionReason.REFUND,
      category,
      credits: 1,
      creditsBefore: creditsAfter - 1,
      creditsAfter,
      metaMessageId,
      description: `Refund: Meta failure — ${failureReason}`,
    });

    this.logger.log(`Credit refunded: org=${orgId} cat=${category} msgId=${metaMessageId}`);
  }

  // ── Bulk refund for campaign failed messages ───────────────────────
  async bulkRefundCampaign(
    orgId: string,
    category: WalletCategory,
    failedCount: number,
    campaignId: string,
    campaignName: string,
  ): Promise<void> {
    if (failedCount <= 0) return;

    const organization = new Types.ObjectId(orgId);
    const f = fieldsFor(category);
    await this.getOrCreate(orgId);
    const wallet = (await this.walletModel.findOneAndUpdate(
      { organization },
      { $inc: { [f.balance]: failedCount, [f.used]: -failedCount } },
      { new: true },
    ))!;
    const creditsAfter = wallet[category] as number;

    await this.txModel.create({
      organization,
      wallet: wallet._id,
      type: TransactionType.REFUND,
      reason: TransactionReason.REFUND,
      category,
      credits: failedCount,
      creditsBefore: creditsAfter - failedCount,
      creditsAfter,
      campaign: new Types.ObjectId(campaignId),
      description: `Campaign "${campaignName}" — ${failedCount} failed message${failedCount > 1 ? 's' : ''} refunded`,
    });

    this.logger.log(
      `Bulk refund: org=${orgId} cat=${category} +${failedCount} credits (campaign=${campaignId})`,
    );
  }

  // ── Update wallet settings ─────────────────────────────────────────
  async updateSettings(
    orgId: string,
    dto: UpdateWalletSettingsDto,
  ): Promise<WalletDocument> {
    await this.getOrCreate(orgId);
    return (await this.walletModel.findOneAndUpdate(
      { organization: new Types.ObjectId(orgId) },
      { $set: dto },
      { new: true },
    ))!;
  }

  // ── Transaction history ────────────────────────────────────────────
  async getTransactions(orgId: string, query: WalletTxQueryDto) {
    const filter: any = { organization: new Types.ObjectId(orgId) };
    if (query.category) filter.category = query.category;
    if (query.reason) filter.reason = query.reason;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.txModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('counterparty', 'name slug')
        .exec(),
      this.txModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Usage summary ──────────────────────────────────────────────────
  async getUsageSummary(orgId: string) {
    const org = new Types.ObjectId(orgId);
    const wallet = await this.getOrCreate(orgId);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const monthlyUsage = await this.txModel.aggregate([
      {
        $match: {
          organization: org,
          type: TransactionType.DEBIT,
          reason: TransactionReason.MESSAGE_USE,
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: '$category',
          used: { $sum: '$credits' },
          count: { $sum: 1 },
        },
      },
    ]);

    const usage: Record<string, number> = {};
    monthlyUsage.forEach((r) => { usage[r._id] = r.used; });

    return {
      credits: {
        transactional: wallet.transactional,
        promotional: wallet.promotional,
        authentication: wallet.authentication,
      },
      lifetime: {
        transactionalAdded: wallet.totalTransactionalAdded,
        promotionalAdded: wallet.totalPromotionalAdded,
        authenticationAdded: wallet.totalAuthenticationAdded,
        transactionalUsed: wallet.totalTransactionalUsed,
        promotionalUsed: wallet.totalPromotionalUsed,
        authenticationUsed: wallet.totalAuthenticationUsed,
      },
      thisMonth: {
        transactional: usage['transactional'] || 0,
        promotional: usage['promotional'] || 0,
        authentication: usage['authentication'] || 0,
      },
    };
  }

  // ── Delete wallet & transactions for org (on org deletion) ──────
  async deleteForOrg(orgId: string): Promise<void> {
    const orgObjectId = new Types.ObjectId(orgId);
    await this.txModel.deleteMany({ organization: orgObjectId });
    await this.walletModel.deleteOne({ organization: orgObjectId });
    this.logger.log(`Wallet and transactions deleted for org=${orgId}`);
  }

  // ── Admin: all org wallets (sorted by lowest credits) ─────────────
  async getAllWallets() {
    return this.walletModel
      .find({})
      .populate('organization', 'name slug status isReseller reseller')
      .sort({ transactional: 1 })
      .exec();
  }

  // ── Map message category string → WalletCategory ──────────────────
  static toWalletCategory(metaCategory: string): WalletCategory {
    switch (metaCategory?.toUpperCase()) {
      case 'MARKETING':
      case 'PROMOTIONAL': return WalletCategory.PROMOTIONAL;
      case 'AUTHENTICATION': return WalletCategory.AUTHENTICATION;
      case 'UTILITY':
      case 'TRANSACTIONAL':
      default: return WalletCategory.TRANSACTIONAL;
    }
  }
}

// ── helpers ───────────────────────────────────────────────────────────
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Wallet field names for one category, e.g. transactional → totalTransactionalAdded. */
function fieldsFor(category: WalletCategory) {
  const c = cap(category);
  return {
    balance: category as string,
    added: `total${c}Added`,
    used: `total${c}Used`,
    threshold: `low${c}Threshold`,
    alert: `low${c}AlertSent`,
  };
}

function balancesOf(w: WalletDocument): CreditBalances {
  return {
    transactional: w.transactional,
    promotional: w.promotional,
    authentication: w.authentication,
  };
}
