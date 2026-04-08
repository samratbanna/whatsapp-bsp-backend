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
var MessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_1 = require("./schemas/message.schema");
const waba_service_1 = require("../waba/waba.service");
const meta_api_service_1 = require("../../common/services/meta-api.service");
const wallet_service_1 = require("../wallet/wallet.service");
const wallet_schema_1 = require("../wallet/schemas/wallet.schema");
let MessagesService = MessagesService_1 = class MessagesService {
    messageModel;
    wabaService;
    metaApi;
    walletService;
    logger = new common_1.Logger(MessagesService_1.name);
    constructor(messageModel, wabaService, metaApi, walletService) {
        this.messageModel = messageModel;
        this.wabaService = wabaService;
        this.metaApi = metaApi;
        this.walletService = walletService;
    }
    async sendText(orgId, dto) {
        const waba = dto.wabaId
            ? await this.wabaService.findOne(dto.wabaId, orgId)
            : await this.wabaService.findDefaultForOrg(orgId);
        if (!waba)
            throw new common_1.BadRequestException('No active WABA found for this organization');
        if (waba.walletBillingEnabled) {
            await this.walletService.deductCredit(orgId, wallet_schema_1.WalletCategory.TRANSACTIONAL);
        }
        const payload = {
            to: dto.to,
            type: 'text',
            text: { body: dto.text, preview_url: false },
        };
        const result = await this.metaApi.sendMessage(waba.phoneNumberId, waba.accessToken, payload);
        return this.messageModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: waba._id,
            metaMessageId: result.messages?.[0]?.id,
            from: waba.displayPhoneNumber,
            to: dto.to,
            direction: message_schema_1.MessageDirection.OUTBOUND,
            type: message_schema_1.MessageType.TEXT,
            status: message_schema_1.MessageStatus.SENT,
            content: { text: dto.text },
            sentAt: new Date(),
        });
    }
    async sendTemplate(orgId, dto) {
        const waba = dto.wabaId
            ? await this.wabaService.findOne(dto.wabaId, orgId)
            : await this.wabaService.findDefaultForOrg(orgId);
        if (!waba)
            throw new common_1.BadRequestException('No active WABA found');
        if (waba.walletBillingEnabled) {
            const walletCat = wallet_service_1.WalletService.toWalletCategory(dto.category || 'UTILITY');
            await this.walletService.deductCredit(orgId, walletCat);
        }
        const payload = {
            to: dto.to,
            type: 'template',
            template: {
                name: dto.templateName,
                language: { code: dto.languageCode },
                components: dto.components || [],
            },
        };
        const result = await this.metaApi.sendMessage(waba.phoneNumberId, waba.accessToken, payload);
        return this.messageModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: waba._id,
            metaMessageId: result.messages?.[0]?.id,
            from: waba.displayPhoneNumber,
            to: dto.to,
            direction: message_schema_1.MessageDirection.OUTBOUND,
            type: message_schema_1.MessageType.TEMPLATE,
            status: message_schema_1.MessageStatus.SENT,
            content: {
                templateName: dto.templateName,
                templateLanguage: dto.languageCode,
                templateComponents: dto.components,
            },
            sentAt: new Date(),
        });
    }
    async sendMedia(orgId, dto) {
        const waba = dto.wabaId
            ? await this.wabaService.findOne(dto.wabaId, orgId)
            : await this.wabaService.findDefaultForOrg(orgId);
        if (!waba)
            throw new common_1.BadRequestException('No active WABA found');
        if (waba.walletBillingEnabled) {
            await this.walletService.deductCredit(orgId, wallet_schema_1.WalletCategory.TRANSACTIONAL);
        }
        const typeKey = dto.type.toLowerCase();
        const payload = {
            to: dto.to,
            type: typeKey,
            [typeKey]: {
                link: dto.mediaUrl,
                ...(dto.caption && { caption: dto.caption }),
                ...(dto.filename && { filename: dto.filename }),
            },
        };
        const result = await this.metaApi.sendMessage(waba.phoneNumberId, waba.accessToken, payload);
        return this.messageModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: waba._id,
            metaMessageId: result.messages?.[0]?.id,
            from: waba.displayPhoneNumber,
            to: dto.to,
            direction: message_schema_1.MessageDirection.OUTBOUND,
            type: dto.type,
            status: message_schema_1.MessageStatus.SENT,
            content: { mediaUrl: dto.mediaUrl, caption: dto.caption, filename: dto.filename },
            sentAt: new Date(),
        });
    }
    async storeInbound(orgId, wabaId, rawMessage) {
        const existing = await this.messageModel.findOne({
            metaMessageId: rawMessage.id,
        });
        if (existing)
            return existing;
        const contentMap = {};
        const type = rawMessage.type;
        if (rawMessage.text)
            contentMap.text = rawMessage.text.body;
        if (rawMessage.image)
            contentMap.mediaId = rawMessage.image.id;
        if (rawMessage.video)
            contentMap.mediaId = rawMessage.video.id;
        if (rawMessage.audio)
            contentMap.mediaId = rawMessage.audio.id;
        if (rawMessage.document) {
            contentMap.mediaId = rawMessage.document.id;
            contentMap.filename = rawMessage.document.filename;
            contentMap.mimeType = rawMessage.document.mime_type;
            contentMap.caption = rawMessage.document.caption;
        }
        if (rawMessage.location)
            contentMap.location = rawMessage.location;
        if (rawMessage.reaction)
            contentMap.reaction = rawMessage.reaction;
        if (rawMessage.sticker)
            contentMap.mediaId = rawMessage.sticker.id;
        const windowExpiry = new Date();
        windowExpiry.setHours(windowExpiry.getHours() + 24);
        return this.messageModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: new mongoose_2.Types.ObjectId(wabaId),
            metaMessageId: rawMessage.id,
            from: rawMessage.from,
            to: rawMessage.to || '',
            direction: message_schema_1.MessageDirection.INBOUND,
            type,
            status: message_schema_1.MessageStatus.DELIVERED,
            content: contentMap,
            conversationWindowExpiry: windowExpiry,
            deliveredAt: new Date(),
        });
    }
    async updateStatus(metaMessageId, status, timestamp, errorData, orgId) {
        const updateData = {};
        const ts = timestamp ? new Date(timestamp * 1000) : new Date();
        switch (status) {
            case 'sent':
                updateData.status = message_schema_1.MessageStatus.SENT;
                updateData.sentAt = ts;
                break;
            case 'delivered':
                updateData.status = message_schema_1.MessageStatus.DELIVERED;
                updateData.deliveredAt = ts;
                break;
            case 'read':
                updateData.status = message_schema_1.MessageStatus.READ;
                updateData.readAt = ts;
                break;
            case 'failed':
                updateData.status = message_schema_1.MessageStatus.FAILED;
                updateData.failedAt = ts;
                updateData.failureReason = errorData?.title || 'Unknown error';
                if (orgId) {
                    this.walletService
                        .refundCredit(orgId, metaMessageId, errorData?.title || 'Delivery failed')
                        .catch((err) => this.logger.warn(`Refund failed: ${err.message}`));
                }
                break;
        }
        await this.messageModel.findOneAndUpdate({ metaMessageId }, { $set: updateData });
    }
    async findAll(orgId, query) {
        const filter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        if (query.phone) {
            filter.$or = [{ from: query.phone }, { to: query.phone }];
        }
        if (query.wabaId) {
            filter.waba = new mongoose_2.Types.ObjectId(query.wabaId);
        }
        const page = query.page || 1;
        const limit = query.limit || 50;
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            this.messageModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.messageModel.countDocuments(filter),
        ]);
        return { data: messages, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async getConversations(orgId, wabaId) {
        const match = { organization: new mongoose_2.Types.ObjectId(orgId) };
        if (wabaId)
            match.waba = new mongoose_2.Types.ObjectId(wabaId);
        return this.messageModel.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ['$direction', 'inbound'] },
                            then: '$from',
                            else: '$to',
                        },
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [
                                        { $eq: ['$direction', 'inbound'] },
                                        { $ne: ['$status', 'read'] },
                                    ] },
                                1, 0,
                            ],
                        },
                    },
                    messageCount: { $sum: 1 },
                },
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
            { $limit: 100 },
        ]);
    }
    async getStats(orgId) {
        const orgFilter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [total, todayCount, inbound, outbound, failed] = await Promise.all([
            this.messageModel.countDocuments(orgFilter),
            this.messageModel.countDocuments({ ...orgFilter, createdAt: { $gte: today } }),
            this.messageModel.countDocuments({ ...orgFilter, direction: message_schema_1.MessageDirection.INBOUND }),
            this.messageModel.countDocuments({ ...orgFilter, direction: message_schema_1.MessageDirection.OUTBOUND }),
            this.messageModel.countDocuments({ ...orgFilter, status: message_schema_1.MessageStatus.FAILED }),
        ]);
        return { total, today: todayCount, inbound, outbound, failed };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = MessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        waba_service_1.WabaService,
        meta_api_service_1.MetaApiService,
        wallet_service_1.WalletService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map