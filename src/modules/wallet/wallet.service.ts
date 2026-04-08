import {
  Injectable, NotFoundException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Wallet, WalletDocument,
  WalletTransaction, WalletTransactionDocument,
  WalletCategory, TransactionType, TransactionReason,
} from './schemas/wallet.schema';
import {
  AddCreditsDto, BulkAddCreditsDto,
  UpdateWalletSettingsDto, WalletTxQueryDto,
} from './dto/wallet.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name) private txModel: Model<WalletTransactionDocument>,
  ) {}

  // ── Get or create wallet ───────────────────────────────────────────
  async getOrCreate(orgId: string): Promise<WalletDocument> {
    let wallet = await this.walletModel.findOne({
      organization: new Types.ObjectId(orgId),
    });
    if (!wallet) {
      wallet = await this.walletModel.create({
        organization: new Types.ObjectId(orgId),
      });
    }
    return wallet;
  }

  // ── Initialize wallet on org creation (10 credits per segment) ────
  async initializeForOrg(orgId: string): Promise<WalletDocument> {
    const DEFAULT_CREDITS = 10;
    const wallet = await this.walletModel.create({
      organization:          new Types.ObjectId(orgId),
      transactional:         DEFAULT_CREDITS,
      promotional:           DEFAULT_CREDITS,
      authentication:        DEFAULT_CREDITS,
      totalTransactionalAdded:   DEFAULT_CREDITS,
      totalPromotionalAdded:     DEFAULT_CREDITS,
      totalAuthenticationAdded:  DEFAULT_CREDITS,
    });

    // Record welcome bonus transactions for each category
    await this.txModel.insertMany([
      {
        organization: new Types.ObjectId(orgId),
        wallet:       wallet._id,
        type:         TransactionType.CREDIT,
        reason:       TransactionReason.BONUS,
        category:     WalletCategory.TRANSACTIONAL,
        credits:      DEFAULT_CREDITS,
        creditsBefore: 0,
        creditsAfter:  DEFAULT_CREDITS,
        description:  'Welcome bonus — 10 transactional credits',
        performedBy:  'system',
      },
      {
        organization: new Types.ObjectId(orgId),
        wallet:       wallet._id,
        type:         TransactionType.CREDIT,
        reason:       TransactionReason.BONUS,
        category:     WalletCategory.PROMOTIONAL,
        credits:      DEFAULT_CREDITS,
        creditsBefore: 0,
        creditsAfter:  DEFAULT_CREDITS,
        description:  'Welcome bonus — 10 promotional credits',
        performedBy:  'system',
      },
      {
        organization: new Types.ObjectId(orgId),
        wallet:       wallet._id,
        type:         TransactionType.CREDIT,
        reason:       TransactionReason.BONUS,
        category:     WalletCategory.AUTHENTICATION,
        credits:      DEFAULT_CREDITS,
        creditsBefore: 0,
        creditsAfter:  DEFAULT_CREDITS,
        description:  'Welcome bonus — 10 authentication credits',
        performedBy:  'system',
      },
    ]);

    this.logger.log(
      `Wallet initialized for org=${orgId} with ${DEFAULT_CREDITS} credits per segment`,
    );
    return wallet;
  }

  // ── Get credits summary ────────────────────────────────────────────
  async getCredits(orgId: string) {
    const wallet = await this.getOrCreate(orgId);
    return {
      transactional:  wallet.transactional,
      promotional:    wallet.promotional,
      authentication: wallet.authentication,
      blockOnEmpty:   wallet.blockOnEmpty,
      thresholds: {
        transactional:  wallet.lowTransactionalThreshold,
        promotional:    wallet.lowPromotionalThreshold,
        authentication: wallet.lowAuthenticationThreshold,
      },
    };
  }

  // ── Add credits (super admin) ──────────────────────────────────────
  async addCredits(
    orgId: string,
    dto: AddCreditsDto,
    adminId: string,
  ): Promise<{ wallet: WalletDocument; transaction: WalletTransactionDocument }> {
    const wallet = await this.getOrCreate(orgId);
    const creditsBefore = wallet[dto.category] as number;
    const creditsAfter  = creditsBefore + dto.credits;

    // Update balance
    wallet[dto.category] = creditsAfter;
    (wallet as any)[`total${cap(dto.category)}Added`] += dto.credits;

    // Reset alert flag on top-up
    (wallet as any)[`low${cap(dto.category)}AlertSent`] = false;
    await wallet.save();

    const transaction = await this.txModel.create({
      organization:  new Types.ObjectId(orgId),
      wallet:        wallet._id,
      type:          TransactionType.CREDIT,
      reason:        dto.reason,
      category:      dto.category,
      credits:       dto.credits,
      creditsBefore,
      creditsAfter,
      description:   dto.description || `${dto.credits} ${dto.category} credits added`,
      performedBy:   adminId,
    });

    this.logger.log(
      `Credits added: org=${orgId} cat=${dto.category} +${dto.credits} → ${creditsAfter}`,
    );
    return { wallet, transaction };
  }

  // ── Bulk add across categories (convenience) ───────────────────────
  async bulkAddCredits(
    orgId: string,
    dto: BulkAddCreditsDto,
    adminId: string,
  ): Promise<WalletDocument> {
    if (dto.transactional) {
      await this.addCredits(orgId, {
        category: WalletCategory.TRANSACTIONAL,
        credits:  dto.transactional,
        reason:   TransactionReason.ADMIN_TOPUP,
        description: dto.description,
      }, adminId);
    }
    if (dto.promotional) {
      await this.addCredits(orgId, {
        category: WalletCategory.PROMOTIONAL,
        credits:  dto.promotional,
        reason:   TransactionReason.ADMIN_TOPUP,
        description: dto.description,
      }, adminId);
    }
    if (dto.authentication) {
      await this.addCredits(orgId, {
        category: WalletCategory.AUTHENTICATION,
        credits:  dto.authentication,
        reason:   TransactionReason.ADMIN_TOPUP,
        description: dto.description,
      }, adminId);
    }
    return this.getOrCreate(orgId);
  }

  // ── KEY: Deduct 1 credit on message send ──────────────────────────
  async deductCredit(
    orgId: string,
    category: WalletCategory,
    messageId?: string,
    campaignId?: string,
    metaMessageId?: string,
  ): Promise<void> {
    const wallet = await this.getOrCreate(orgId);

    const current = wallet[category] as number;

    if (wallet.blockOnEmpty && current < 1) {
      throw new BadRequestException(
        `Insufficient ${category} message credits. Current: ${current}. Please contact admin to top up.`,
      );
    }

    const creditsBefore = current;
    const creditsAfter  = Math.max(0, current - 1);

    wallet[category] = creditsAfter;
    (wallet as any)[`total${cap(category)}Used`] += 1;
    await wallet.save();

    await this.txModel.create({
      organization:  new Types.ObjectId(orgId),
      wallet:        wallet._id,
      type:          TransactionType.DEBIT,
      reason:        TransactionReason.MESSAGE_USE,
      category,
      credits:       1,
      creditsBefore,
      creditsAfter,
      message:       messageId   ? new Types.ObjectId(messageId)   : undefined,
      campaign:      campaignId  ? new Types.ObjectId(campaignId)  : undefined,
      metaMessageId,
      description:   `1 ${category} credit used`,
    });

    // Low credits alert
    const threshold = (wallet as any)[`low${cap(category)}Threshold`] as number;
    const alertSentKey = `low${cap(category)}AlertSent`;
    if (creditsAfter <= threshold && !(wallet as any)[alertSentKey]) {
      (wallet as any)[alertSentKey] = true;
      await wallet.save();
      this.logger.warn(`Low credits alert: org=${orgId} cat=${category} remaining=${creditsAfter}`);
      // TODO: emit email/push notification
    }
  }

  // ── Refund 1 credit on Meta delivery failure ───────────────────────
  async refundCredit(
    orgId: string,
    metaMessageId: string,
    failureReason: string,
  ): Promise<void> {
    // Find original debit
    const original = await this.txModel.findOne({
      organization:  new Types.ObjectId(orgId),
      metaMessageId,
      type:          TransactionType.DEBIT,
      reason:        TransactionReason.MESSAGE_USE,
    });
    if (!original) return;

    // Already refunded?
    const exists = await this.txModel.findOne({
      organization:  new Types.ObjectId(orgId),
      metaMessageId,
      type:          TransactionType.REFUND,
    });
    if (exists) return;

    const wallet = await this.getOrCreate(orgId);
    const category = original.category;
    const creditsBefore = wallet[category] as number;
    const creditsAfter  = creditsBefore + 1;

    wallet[category] = creditsAfter;
    (wallet as any)[`total${cap(category)}Used`] = Math.max(
      0,
      (wallet as any)[`total${cap(category)}Used`] - 1,
    );
    await wallet.save();

    await this.txModel.create({
      organization:  new Types.ObjectId(orgId),
      wallet:        wallet._id,
      type:          TransactionType.REFUND,
      reason:        TransactionReason.REFUND,
      category,
      credits:       1,
      creditsBefore,
      creditsAfter,
      metaMessageId,
      description:   `Refund: Meta failure — ${failureReason}`,
    });

    this.logger.log(`Credit refunded: org=${orgId} cat=${category} msgId=${metaMessageId}`);
  }

  // ── Update wallet settings ─────────────────────────────────────────
  async updateSettings(
    orgId: string,
    dto: UpdateWalletSettingsDto,
  ): Promise<WalletDocument> {
    const wallet = await this.getOrCreate(orgId);
    Object.assign(wallet, dto);
    return wallet.save();
  }

  // ── Transaction history ────────────────────────────────────────────
  async getTransactions(orgId: string, query: WalletTxQueryDto) {
    const filter: any = { organization: new Types.ObjectId(orgId) };
    if (query.category) filter.category = query.category;
    if (query.reason)   filter.reason   = query.reason;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to)   filter.createdAt.$lte = new Date(query.to);
    }

    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 50;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.txModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.txModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Usage summary ──────────────────────────────────────────────────
  async getUsageSummary(orgId: string) {
    const org       = new Types.ObjectId(orgId);
    const wallet    = await this.getOrCreate(orgId);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const monthlyUsage = await this.txModel.aggregate([
      {
        $match: {
          organization: org,
          type:         TransactionType.DEBIT,
          reason:       TransactionReason.MESSAGE_USE,
          createdAt:    { $gte: monthStart },
        },
      },
      {
        $group: {
          _id:    '$category',
          used:   { $sum: '$credits' },
          count:  { $sum: 1 },
        },
      },
    ]);

    const usage: Record<string, number> = {};
    monthlyUsage.forEach((r) => { usage[r._id] = r.used; });

    return {
      credits: {
        transactional:  wallet.transactional,
        promotional:    wallet.promotional,
        authentication: wallet.authentication,
      },
      lifetime: {
        transactionalAdded:  wallet.totalTransactionalAdded,
        promotionalAdded:    wallet.totalPromotionalAdded,
        authenticationAdded: wallet.totalAuthenticationAdded,
        transactionalUsed:   wallet.totalTransactionalUsed,
        promotionalUsed:     wallet.totalPromotionalUsed,
        authenticationUsed:  wallet.totalAuthenticationUsed,
      },
      thisMonth: {
        transactional:  usage['transactional']  || 0,
        promotional:    usage['promotional']    || 0,
        authentication: usage['authentication'] || 0,
      },
    };
  }

  // ── Admin: all org wallets (sorted by lowest credits) ─────────────
  async getAllWallets() {
    return this.walletModel
      .find({})
      .populate('organization', 'name slug status')
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

// helper
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

