"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const wallet_schema_1 = require("./schemas/wallet.schema");
let WalletService = WalletService_1 = class WalletService {
    walletModel;
    txModel;
    logger = new common_1.Logger(WalletService_1.name);
    constructor(walletModel, txModel) {
        this.walletModel = walletModel;
        this.txModel = txModel;
    }
    async getOrCreate(orgId) {
        let wallet = await this.walletModel.findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
        if (!wallet) {
            wallet = await this.walletModel.create({
                organization: new mongoose_2.Types.ObjectId(orgId),
            });
        }
        return wallet;
    }
    async initializeForOrg(orgId) {
        const DEFAULT_CREDITS = 10;
        const wallet = await this.walletModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            transactional: DEFAULT_CREDITS,
            promotional: DEFAULT_CREDITS,
            authentication: DEFAULT_CREDITS,
            totalTransactionalAdded: DEFAULT_CREDITS,
            totalPromotionalAdded: DEFAULT_CREDITS,
            totalAuthenticationAdded: DEFAULT_CREDITS,
        });
        await this.txModel.insertMany([
            {
                organization: new mongoose_2.Types.ObjectId(orgId),
                wallet: wallet._id,
                type: wallet_schema_1.TransactionType.CREDIT,
                reason: wallet_schema_1.TransactionReason.BONUS,
                category: wallet_schema_1.WalletCategory.TRANSACTIONAL,
                credits: DEFAULT_CREDITS,
                creditsBefore: 0,
                creditsAfter: DEFAULT_CREDITS,
                description: 'Welcome bonus — 10 transactional credits',
                performedBy: 'system',
            },
            {
                organization: new mongoose_2.Types.ObjectId(orgId),
                wallet: wallet._id,
                type: wallet_schema_1.TransactionType.CREDIT,
                reason: wallet_schema_1.TransactionReason.BONUS,
                category: wallet_schema_1.WalletCategory.PROMOTIONAL,
                credits: DEFAULT_CREDITS,
                creditsBefore: 0,
                creditsAfter: DEFAULT_CREDITS,
                description: 'Welcome bonus — 10 promotional credits',
                performedBy: 'system',
            },
            {
                organization: new mongoose_2.Types.ObjectId(orgId),
                wallet: wallet._id,
                type: wallet_schema_1.TransactionType.CREDIT,
                reason: wallet_schema_1.TransactionReason.BONUS,
                category: wallet_schema_1.WalletCategory.AUTHENTICATION,
                credits: DEFAULT_CREDITS,
                creditsBefore: 0,
                creditsAfter: DEFAULT_CREDITS,
                description: 'Welcome bonus — 10 authentication credits',
                performedBy: 'system',
            },
        ]);
        this.logger.log(`Wallet initialized for org=${orgId} with ${DEFAULT_CREDITS} credits per segment`);
        return wallet;
    }
    async getCredits(orgId) {
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
    async addCredits(orgId, dto, adminId) {
        const wallet = await this.getOrCreate(orgId);
        const creditsBefore = wallet[dto.category];
        const creditsAfter = creditsBefore + dto.credits;
        wallet[dto.category] = creditsAfter;
        wallet[`total${cap(dto.category)}Added`] += dto.credits;
        wallet[`low${cap(dto.category)}AlertSent`] = false;
        await wallet.save();
        const transaction = await this.txModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            wallet: wallet._id,
            type: wallet_schema_1.TransactionType.CREDIT,
            reason: dto.reason,
            category: dto.category,
            credits: dto.credits,
            creditsBefore,
            creditsAfter,
            description: dto.description || `${dto.credits} ${dto.category} credits added`,
            performedBy: adminId,
        });
        this.logger.log(`Credits added: org=${orgId} cat=${dto.category} +${dto.credits} → ${creditsAfter}`);
        return { wallet, transaction };
    }
    async bulkAddCredits(orgId, dto, adminId) {
        if (dto.transactional) {
            await this.addCredits(orgId, {
                category: wallet_schema_1.WalletCategory.TRANSACTIONAL,
                credits: dto.transactional,
                reason: wallet_schema_1.TransactionReason.ADMIN_TOPUP,
                description: dto.description,
            }, adminId);
        }
        if (dto.promotional) {
            await this.addCredits(orgId, {
                category: wallet_schema_1.WalletCategory.PROMOTIONAL,
                credits: dto.promotional,
                reason: wallet_schema_1.TransactionReason.ADMIN_TOPUP,
                description: dto.description,
            }, adminId);
        }
        if (dto.authentication) {
            await this.addCredits(orgId, {
                category: wallet_schema_1.WalletCategory.AUTHENTICATION,
                credits: dto.authentication,
                reason: wallet_schema_1.TransactionReason.ADMIN_TOPUP,
                description: dto.description,
            }, adminId);
        }
        return this.getOrCreate(orgId);
    }
    async deductCredit(orgId, category, messageId, campaignId, metaMessageId) {
        const wallet = await this.getOrCreate(orgId);
        const current = wallet[category];
        if (wallet.blockOnEmpty && current < 1) {
            throw new common_1.BadRequestException(`Insufficient ${category} message credits. Current: ${current}. Please contact admin to top up.`);
        }
        const creditsBefore = current;
        const creditsAfter = Math.max(0, current - 1);
        wallet[category] = creditsAfter;
        wallet[`total${cap(category)}Used`] += 1;
        await wallet.save();
        await this.txModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            wallet: wallet._id,
            type: wallet_schema_1.TransactionType.DEBIT,
            reason: wallet_schema_1.TransactionReason.MESSAGE_USE,
            category,
            credits: 1,
            creditsBefore,
            creditsAfter,
            message: messageId ? new mongoose_2.Types.ObjectId(messageId) : undefined,
            campaign: campaignId ? new mongoose_2.Types.ObjectId(campaignId) : undefined,
            metaMessageId,
            description: `1 ${category} credit used`,
        });
        const threshold = wallet[`low${cap(category)}Threshold`];
        const alertSentKey = `low${cap(category)}AlertSent`;
        if (creditsAfter <= threshold && !wallet[alertSentKey]) {
            wallet[alertSentKey] = true;
            await wallet.save();
            this.logger.warn(`Low credits alert: org=${orgId} cat=${category} remaining=${creditsAfter}`);
        }
    }
    async refundCredit(orgId, metaMessageId, failureReason) {
        const original = await this.txModel.findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
            metaMessageId,
            type: wallet_schema_1.TransactionType.DEBIT,
            reason: wallet_schema_1.TransactionReason.MESSAGE_USE,
        });
        if (!original)
            return;
        const exists = await this.txModel.findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
            metaMessageId,
            type: wallet_schema_1.TransactionType.REFUND,
        });
        if (exists)
            return;
        const wallet = await this.getOrCreate(orgId);
        const category = original.category;
        const creditsBefore = wallet[category];
        const creditsAfter = creditsBefore + 1;
        wallet[category] = creditsAfter;
        wallet[`total${cap(category)}Used`] = Math.max(0, wallet[`total${cap(category)}Used`] - 1);
        await wallet.save();
        await this.txModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            wallet: wallet._id,
            type: wallet_schema_1.TransactionType.REFUND,
            reason: wallet_schema_1.TransactionReason.REFUND,
            category,
            credits: 1,
            creditsBefore,
            creditsAfter,
            metaMessageId,
            description: `Refund: Meta failure — ${failureReason}`,
        });
        this.logger.log(`Credit refunded: org=${orgId} cat=${category} msgId=${metaMessageId}`);
    }
    async updateSettings(orgId, dto) {
        const wallet = await this.getOrCreate(orgId);
        Object.assign(wallet, dto);
        return wallet.save();
    }
    async getTransactions(orgId, query) {
        const filter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        if (query.category)
            filter.category = query.category;
        if (query.reason)
            filter.reason = query.reason;
        if (query.from || query.to) {
            filter.createdAt = {};
            if (query.from)
                filter.createdAt.$gte = new Date(query.from);
            if (query.to)
                filter.createdAt.$lte = new Date(query.to);
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.txModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.txModel.countDocuments(filter),
        ]);
        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async getUsageSummary(orgId) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        const wallet = await this.getOrCreate(orgId);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const monthlyUsage = await this.txModel.aggregate([
            {
                $match: {
                    organization: org,
                    type: wallet_schema_1.TransactionType.DEBIT,
                    reason: wallet_schema_1.TransactionReason.MESSAGE_USE,
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
        const usage = {};
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
    async getAllWallets() {
        return this.walletModel
            .find({})
            .populate('organization', 'name slug status')
            .sort({ transactional: 1 })
            .exec();
    }
    static toWalletCategory(metaCategory) {
        switch (metaCategory?.toUpperCase()) {
            case 'MARKETING':
            case 'PROMOTIONAL': return wallet_schema_1.WalletCategory.PROMOTIONAL;
            case 'AUTHENTICATION': return wallet_schema_1.WalletCategory.AUTHENTICATION;
            case 'UTILITY':
            case 'TRANSACTIONAL':
            default: return wallet_schema_1.WalletCategory.TRANSACTIONAL;
        }
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(wallet_schema_1.Wallet.name)),
    __param(1, (0, mongoose_1.InjectModel)(wallet_schema_1.WalletTransaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], WalletService);
function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
//# sourceMappingURL=wallet.service.js.map