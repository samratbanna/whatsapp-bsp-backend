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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_1 = require("../messages/schemas/message.schema");
const campaign_schema_1 = require("../campaigns/schemas/campaign.schema");
const contact_schema_1 = require("../contacts/schemas/contact.schema");
const flow_schema_1 = require("../flow-builder/schemas/flow.schema");
let AnalyticsService = class AnalyticsService {
    messageModel;
    campaignModel;
    contactModel;
    flowModel;
    constructor(messageModel, campaignModel, contactModel, flowModel) {
        this.messageModel = messageModel;
        this.campaignModel = campaignModel;
        this.contactModel = contactModel;
        this.flowModel = flowModel;
    }
    async getDashboard(orgId) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const monthStart = new Date(now);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const [totalMessages, todayMessages, weekMessages, totalContacts, newContactsToday, totalCampaigns, activeCampaigns, activeFlows, deliveryStats, messagesByDay,] = await Promise.all([
            this.messageModel.countDocuments({ organization: org }),
            this.messageModel.countDocuments({ organization: org, createdAt: { $gte: todayStart } }),
            this.messageModel.countDocuments({ organization: org, createdAt: { $gte: weekStart } }),
            this.contactModel.countDocuments({ organization: org, optedOut: false }),
            this.contactModel.countDocuments({ organization: org, createdAt: { $gte: todayStart } }),
            this.campaignModel.countDocuments({ organization: org }),
            this.campaignModel.countDocuments({ organization: org, status: 'running' }),
            this.flowModel.countDocuments({ organization: org, status: 'active' }),
            this.getDeliveryStats(orgId),
            this.getMessagesByDay(orgId, 7),
        ]);
        return {
            messages: { total: totalMessages, today: todayMessages, thisWeek: weekMessages },
            contacts: { total: totalContacts, newToday: newContactsToday },
            campaigns: { total: totalCampaigns, active: activeCampaigns },
            flows: { active: activeFlows },
            delivery: deliveryStats,
            chart: { messagesByDay },
        };
    }
    async getDeliveryStats(orgId) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        const outboundFilter = { organization: org, direction: message_schema_1.MessageDirection.OUTBOUND };
        const [sent, delivered, read, failed] = await Promise.all([
            this.messageModel.countDocuments({ ...outboundFilter, status: { $in: ['sent', 'delivered', 'read'] } }),
            this.messageModel.countDocuments({ ...outboundFilter, status: { $in: ['delivered', 'read'] } }),
            this.messageModel.countDocuments({ ...outboundFilter, status: message_schema_1.MessageStatus.READ }),
            this.messageModel.countDocuments({ ...outboundFilter, status: message_schema_1.MessageStatus.FAILED }),
        ]);
        return {
            sent,
            delivered,
            read,
            failed,
            deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
            readRate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
            failureRate: sent > 0 ? Math.round((failed / sent) * 100) : 0,
        };
    }
    async getMessagesByDay(orgId, days = 30) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        const since = new Date();
        since.setDate(since.getDate() - days);
        const results = await this.messageModel.aggregate([
            { $match: { organization: org, createdAt: { $gte: since } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        direction: '$direction',
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.date': 1 } },
        ]);
        const map = new Map();
        for (const r of results) {
            const key = r._id.date;
            if (!map.has(key))
                map.set(key, { inbound: 0, outbound: 0 });
            const entry = map.get(key);
            if (r._id.direction === 'inbound')
                entry.inbound = r.count;
            else
                entry.outbound = r.count;
        }
        return Array.from(map.entries()).map(([date, counts]) => ({ date, ...counts }));
    }
    async getCampaignStats(orgId, campaignId) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        const match = { organization: org };
        if (campaignId)
            match._id = new mongoose_2.Types.ObjectId(campaignId);
        return this.campaignModel.aggregate([
            { $match: match },
            {
                $project: {
                    name: 1,
                    status: 1,
                    totalCount: 1,
                    sentCount: 1,
                    deliveredCount: 1,
                    readCount: 1,
                    failedCount: 1,
                    deliveryRate: {
                        $cond: [
                            { $gt: ['$sentCount', 0] },
                            { $multiply: [{ $divide: ['$deliveredCount', '$sentCount'] }, 100] },
                            0,
                        ],
                    },
                    readRate: {
                        $cond: [
                            { $gt: ['$deliveredCount', 0] },
                            { $multiply: [{ $divide: ['$readCount', '$deliveredCount'] }, 100] },
                            0,
                        ],
                    },
                    startedAt: 1,
                    completedAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
    }
    async getContactGrowth(orgId, days = 30) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        const since = new Date();
        since.setDate(since.getDate() - days);
        return this.contactModel.aggregate([
            { $match: { organization: org, createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', count: 1, _id: 0 } },
        ]);
    }
    async getFlowStats(orgId) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        return this.flowModel.aggregate([
            { $match: { organization: org } },
            {
                $project: {
                    name: 1,
                    status: 1,
                    triggerCount: 1,
                    completionCount: 1,
                    completionRate: {
                        $cond: [
                            { $gt: ['$triggerCount', 0] },
                            { $multiply: [{ $divide: ['$completionCount', '$triggerCount'] }, 100] },
                            0,
                        ],
                    },
                },
            },
            { $sort: { triggerCount: -1 } },
        ]);
    }
    async getTopContacts(orgId, limit = 10) {
        const org = new mongoose_2.Types.ObjectId(orgId);
        return this.messageModel.aggregate([
            { $match: { organization: org } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$direction', 'inbound'] },
                            '$from',
                            '$to',
                        ],
                    },
                    messageCount: { $sum: 1 },
                    lastMessageAt: { $max: '$createdAt' },
                },
            },
            { $sort: { messageCount: -1 } },
            { $limit: limit },
            { $project: { phone: '$_id', messageCount: 1, lastMessageAt: 1, _id: 0 } },
        ]);
    }
    async getPlatformStats() {
        const [orgs, messages, contacts, campaigns] = await Promise.all([
            this.contactModel.db.model('Organization').countDocuments(),
            this.messageModel.countDocuments(),
            this.contactModel.countDocuments(),
            this.campaignModel.countDocuments(),
        ]);
        const revenueByPlan = await this.contactModel.db.model('Organization').aggregate([
            {
                $lookup: {
                    from: 'plans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planData',
                },
            },
            { $unwind: '$planData' },
            {
                $group: {
                    _id: '$planData.name',
                    count: { $sum: 1 },
                    revenue: { $sum: '$planData.price' },
                },
            },
        ]);
        return { orgs, messages, contacts, campaigns, revenueByPlan };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(1, (0, mongoose_1.InjectModel)(campaign_schema_1.Campaign.name)),
    __param(2, (0, mongoose_1.InjectModel)(contact_schema_1.Contact.name)),
    __param(3, (0, mongoose_1.InjectModel)(flow_schema_1.Flow.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map