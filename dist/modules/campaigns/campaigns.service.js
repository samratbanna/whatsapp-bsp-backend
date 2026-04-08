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
var CampaignsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bull_1 = require("@nestjs/bull");
const mongoose_2 = require("mongoose");
const campaign_schema_1 = require("./schemas/campaign.schema");
const waba_service_1 = require("../waba/waba.service");
const campaign_processor_1 = require("./processors/campaign.processor");
let CampaignsService = CampaignsService_1 = class CampaignsService {
    campaignModel;
    campaignQueue;
    wabaService;
    logger = new common_1.Logger(CampaignsService_1.name);
    constructor(campaignModel, campaignQueue, wabaService) {
        this.campaignModel = campaignModel;
        this.campaignQueue = campaignQueue;
        this.wabaService = wabaService;
    }
    async create(orgId, dto) {
        const waba = dto.wabaId
            ? await this.wabaService.findOne(dto.wabaId, orgId)
            : await this.wabaService.findDefaultForOrg(orgId);
        if (!waba)
            throw new common_1.BadRequestException('No active WABA found');
        if (!dto.contacts?.length && !dto.groups?.length) {
            throw new common_1.BadRequestException('Provide at least one contact or group');
        }
        return this.campaignModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: waba._id,
            name: dto.name,
            type: dto.type,
            template: new mongoose_2.Types.ObjectId(dto.templateId),
            templateLanguage: dto.templateLanguage,
            templateVariables: dto.templateVariables || {},
            contacts: dto.contacts?.map((id) => new mongoose_2.Types.ObjectId(id)) || [],
            groups: dto.groups?.map((id) => new mongoose_2.Types.ObjectId(id)) || [],
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
            messagesPerSecond: dto.messagesPerSecond || 10,
            status: campaign_schema_1.CampaignStatus.DRAFT,
        });
    }
    async launch(id, orgId) {
        const campaign = await this.findOne(id, orgId);
        if (campaign.status !== campaign_schema_1.CampaignStatus.DRAFT) {
            throw new common_1.BadRequestException(`Campaign is already ${campaign.status}`);
        }
        const delay = campaign.scheduledAt
            ? Math.max(0, campaign.scheduledAt.getTime() - Date.now())
            : 0;
        const job = await this.campaignQueue.add('broadcast', { campaignId: id, orgId }, {
            delay,
            attempts: 1,
            removeOnComplete: false,
            removeOnFail: false,
            jobId: `campaign-${id}`,
        });
        campaign.status = delay > 0 ? campaign_schema_1.CampaignStatus.SCHEDULED : campaign_schema_1.CampaignStatus.RUNNING;
        campaign.jobId = job.id;
        return campaign.save();
    }
    async pause(id, orgId) {
        const campaign = await this.findOne(id, orgId);
        if (campaign.status !== campaign_schema_1.CampaignStatus.RUNNING) {
            throw new common_1.BadRequestException('Only running campaigns can be paused');
        }
        campaign.status = campaign_schema_1.CampaignStatus.PAUSED;
        return campaign.save();
    }
    async cancel(id, orgId) {
        const campaign = await this.findOne(id, orgId);
        if ([campaign_schema_1.CampaignStatus.COMPLETED, campaign_schema_1.CampaignStatus.FAILED].includes(campaign.status)) {
            throw new common_1.BadRequestException('Cannot cancel a completed or failed campaign');
        }
        if (campaign.jobId) {
            const job = await this.campaignQueue.getJob(campaign.jobId);
            if (job)
                await job.remove();
        }
        campaign.status = campaign_schema_1.CampaignStatus.CANCELLED;
        return campaign.save();
    }
    async findAll(orgId, query) {
        const filter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        if (query.status)
            filter.status = query.status;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.campaignModel
                .find(filter)
                .populate('template', 'name category')
                .populate('waba', 'displayPhoneNumber verifiedName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.campaignModel.countDocuments(filter),
        ]);
        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findOne(id, orgId) {
        const campaign = await this.campaignModel
            .findOne({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) })
            .populate('template', 'name category components')
            .populate('waba', 'displayPhoneNumber')
            .exec();
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return campaign;
    }
    async update(id, orgId, dto) {
        const campaign = await this.findOne(id, orgId);
        if (campaign.status !== campaign_schema_1.CampaignStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft campaigns can be edited');
        }
        Object.assign(campaign, dto);
        return campaign.save();
    }
    async remove(id, orgId) {
        const campaign = await this.findOne(id, orgId);
        if (campaign.status === campaign_schema_1.CampaignStatus.RUNNING) {
            throw new common_1.BadRequestException('Cannot delete a running campaign');
        }
        await campaign.deleteOne();
    }
    async getStats(orgId) {
        const orgFilter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        const results = await this.campaignModel.aggregate([
            { $match: orgFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalSent: { $sum: '$sentCount' },
                    totalFailed: { $sum: '$failedCount' },
                },
            },
        ]);
        return results.reduce((acc, r) => {
            acc[r._id] = { count: r.count, sent: r.totalSent, failed: r.totalFailed };
            return acc;
        }, {});
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = CampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(campaign_schema_1.Campaign.name)),
    __param(1, (0, bull_1.InjectQueue)(campaign_processor_1.CAMPAIGN_QUEUE)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object, waba_service_1.WabaService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map