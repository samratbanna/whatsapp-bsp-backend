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
var CampaignProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignProcessor = exports.CAMPAIGN_QUEUE = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const campaign_schema_1 = require("../schemas/campaign.schema");
const contact_schema_1 = require("../../contacts/schemas/contact.schema");
const waba_service_1 = require("../../waba/waba.service");
const meta_api_service_1 = require("../../../common/services/meta-api.service");
const messages_service_1 = require("../../messages/messages.service");
const wallet_service_1 = require("../../wallet/wallet.service");
const message_schema_1 = require("../../messages/schemas/message.schema");
exports.CAMPAIGN_QUEUE = 'campaign';
let CampaignProcessor = CampaignProcessor_1 = class CampaignProcessor {
    campaignModel;
    contactModel;
    wabaService;
    metaApi;
    messagesService;
    walletService;
    logger = new common_1.Logger(CampaignProcessor_1.name);
    constructor(campaignModel, contactModel, wabaService, metaApi, messagesService, walletService) {
        this.campaignModel = campaignModel;
        this.contactModel = contactModel;
        this.wabaService = wabaService;
        this.metaApi = metaApi;
        this.messagesService = messagesService;
        this.walletService = walletService;
    }
    async handleBroadcast(job) {
        const { campaignId, orgId } = job.data;
        const campaign = await this.campaignModel
            .findById(campaignId)
            .populate('template')
            .exec();
        if (!campaign) {
            this.logger.error(`Campaign ${campaignId} not found`);
            return;
        }
        campaign.status = campaign_schema_1.CampaignStatus.RUNNING;
        campaign.startedAt = new Date();
        await campaign.save();
        try {
            const waba = await this.wabaService.findOne(campaign.waba.toString(), orgId);
            const phones = await this.collectPhones(campaign, orgId);
            campaign.totalCount = phones.length;
            await campaign.save();
            const delayMs = Math.floor(1000 / (campaign.messagesPerSecond || 10));
            const template = campaign.template;
            const walletCat = wallet_service_1.WalletService.toWalletCategory(template.category || 'UTILITY');
            if (waba.walletBillingEnabled) {
                const credits = await this.walletService.getCredits(orgId);
                const available = credits[walletCat];
                if (available < 1) {
                    campaign.status = campaign_schema_1.CampaignStatus.FAILED;
                    campaign.failureReason = `No ${walletCat} credits (${available}). Please top up.`;
                    await campaign.save();
                    this.logger.warn(`Campaign ${campaignId} aborted — no ${walletCat} credits`);
                    return;
                }
            }
            this.logger.log(`Campaign ${campaignId}: ${phones.length} contacts, cat=${walletCat}`);
            for (let i = 0; i < phones.length; i++) {
                const fresh = await this.campaignModel.findById(campaignId).select('status').exec();
                if (fresh?.status === campaign_schema_1.CampaignStatus.CANCELLED || fresh?.status === campaign_schema_1.CampaignStatus.PAUSED) {
                    this.logger.log(`Campaign ${campaignId} stopped at ${i}/${phones.length}`);
                    break;
                }
                const { phone, contact } = phones[i];
                try {
                    if (waba.walletBillingEnabled) {
                        try {
                            await this.walletService.deductCredit(orgId, walletCat, undefined, campaign._id.toString());
                        }
                        catch (walletErr) {
                            this.logger.warn(`Campaign ${campaignId} stopped at ${i} — ${walletErr.message}`);
                            campaign.status = campaign_schema_1.CampaignStatus.PAUSED;
                            campaign.failureReason = walletErr.message;
                            await campaign.save();
                            break;
                        }
                    }
                    const components = this.resolveVariables(template.components || [], campaign.templateVariables || {}, contact);
                    const payload = {
                        to: phone,
                        type: 'template',
                        template: {
                            name: template.name,
                            language: { code: campaign.templateLanguage || 'en_US' },
                            components,
                        },
                    };
                    const result = await this.metaApi.sendMessage(waba.phoneNumberId, waba.accessToken, payload);
                    await this.messagesService['messageModel'].create({
                        organization: new mongoose_2.Types.ObjectId(orgId),
                        waba: campaign.waba,
                        metaMessageId: result.messages?.[0]?.id,
                        from: waba.displayPhoneNumber,
                        to: phone,
                        direction: message_schema_1.MessageDirection.OUTBOUND,
                        type: message_schema_1.MessageType.TEMPLATE,
                        status: message_schema_1.MessageStatus.SENT,
                        content: {
                            templateName: template.name,
                            templateLanguage: campaign.templateLanguage,
                        },
                        campaign: campaign._id,
                        sentAt: new Date(),
                    });
                    campaign.sentCount++;
                }
                catch (err) {
                    this.logger.warn(`Failed to send to ${phone}: ${err.message}`);
                    campaign.failedCount++;
                }
                if (i % 10 === 0) {
                    await campaign.save();
                    await job.progress(Math.floor((i / phones.length) * 100));
                }
                if (i < phones.length - 1) {
                    await this.sleep(delayMs);
                }
            }
            campaign.status = campaign_schema_1.CampaignStatus.COMPLETED;
            campaign.completedAt = new Date();
            await campaign.save();
            this.logger.log(`Campaign ${campaignId} completed: ${campaign.sentCount} sent, ${campaign.failedCount} failed`);
        }
        catch (err) {
            this.logger.error(`Campaign ${campaignId} failed: ${err.message}`);
            campaign.status = campaign_schema_1.CampaignStatus.FAILED;
            campaign.failureReason = err.message;
            await campaign.save();
        }
    }
    async collectPhones(campaign, orgId) {
        const phoneMap = new Map();
        if (campaign.contacts?.length) {
            const contacts = await this.contactModel
                .find({
                _id: { $in: campaign.contacts },
                organization: new mongoose_2.Types.ObjectId(orgId),
                optedOut: false,
            })
                .select('phone name customFields')
                .exec();
            contacts.forEach((c) => phoneMap.set(c.phone, c));
        }
        if (campaign.groups?.length) {
            const contacts = await this.contactModel
                .find({
                groups: { $in: campaign.groups },
                organization: new mongoose_2.Types.ObjectId(orgId),
                optedOut: false,
            })
                .select('phone name customFields')
                .exec();
            contacts.forEach((c) => phoneMap.set(c.phone, c));
        }
        return Array.from(phoneMap.entries()).map(([phone, contact]) => ({
            phone,
            contact,
        }));
    }
    resolveVariables(components, staticVars, contact) {
        const resolve = (val) => val
            .replace(/\{\{contact\.name\}\}/g, contact?.name || '')
            .replace(/\{\{contact\.phone\}\}/g, contact?.phone || '');
        return components.map((comp) => {
            if (!comp.parameters)
                return comp;
            return {
                ...comp,
                parameters: comp.parameters.map((param) => {
                    if (param.type === 'text') {
                        const key = param.text?.replace(/\{\{(\d+)\}\}/, '$1');
                        const val = staticVars[key] || param.text || '';
                        return { ...param, text: resolve(val) };
                    }
                    return param;
                }),
            };
        });
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.CampaignProcessor = CampaignProcessor;
__decorate([
    (0, bull_1.Process)('broadcast'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignProcessor.prototype, "handleBroadcast", null);
exports.CampaignProcessor = CampaignProcessor = CampaignProcessor_1 = __decorate([
    (0, bull_1.Processor)(exports.CAMPAIGN_QUEUE),
    __param(0, (0, mongoose_1.InjectModel)(campaign_schema_1.Campaign.name)),
    __param(1, (0, mongoose_1.InjectModel)(contact_schema_1.Contact.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        waba_service_1.WabaService,
        meta_api_service_1.MetaApiService,
        messages_service_1.MessagesService,
        wallet_service_1.WalletService])
], CampaignProcessor);
//# sourceMappingURL=campaign.processor.js.map