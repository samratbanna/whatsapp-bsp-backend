import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, MessageDirection, MessageStatus } from '../messages/schemas/message.schema';
import { Campaign, CampaignDocument } from '../campaigns/schemas/campaign.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { Flow, FlowDocument } from '../flow-builder/schemas/flow.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    @InjectModel(Flow.name) private flowModel: Model<FlowDocument>,
  ) {}

  // ── Main dashboard overview ────────────────────────────────────────
  async getDashboard(orgId: string) {
    const org = new Types.ObjectId(orgId);
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [
      totalMessages, todayMessages, weekMessages,
      totalContacts, newContactsToday,
      totalCampaigns, activeCampaigns,
      activeFlows,
      deliveryStats,
      messagesByDay,
    ] = await Promise.all([
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

  // ── Delivery rate stats ────────────────────────────────────────────
  async getDeliveryStats(orgId: string) {
    const org = new Types.ObjectId(orgId);
    const outboundFilter = { organization: org, direction: MessageDirection.OUTBOUND };

    const [sent, delivered, read, failed] = await Promise.all([
      this.messageModel.countDocuments({ ...outboundFilter, status: { $in: ['sent', 'delivered', 'read'] } }),
      this.messageModel.countDocuments({ ...outboundFilter, status: { $in: ['delivered', 'read'] } }),
      this.messageModel.countDocuments({ ...outboundFilter, status: MessageStatus.READ }),
      this.messageModel.countDocuments({ ...outboundFilter, status: MessageStatus.FAILED }),
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

  // ── Messages per day chart ─────────────────────────────────────────
  async getMessagesByDay(orgId: string, days = 30) {
    const org = new Types.ObjectId(orgId);
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

    // Reshape into { date, inbound, outbound }
    const map = new Map<string, { inbound: number; outbound: number }>();
    for (const r of results) {
      const key = r._id.date;
      if (!map.has(key)) map.set(key, { inbound: 0, outbound: 0 });
      const entry = map.get(key)!;
      if (r._id.direction === 'inbound') entry.inbound = r.count;
      else entry.outbound = r.count;
    }

    return Array.from(map.entries()).map(([date, counts]) => ({ date, ...counts }));
  }

  // ── Campaign performance ───────────────────────────────────────────
  async getCampaignStats(orgId: string, campaignId?: string) {
    const org = new Types.ObjectId(orgId);
    const match: any = { organization: org };
    if (campaignId) match._id = new Types.ObjectId(campaignId);

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

  // ── Contact growth chart ───────────────────────────────────────────
  async getContactGrowth(orgId: string, days = 30) {
    const org = new Types.ObjectId(orgId);
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

  // ── Flow analytics ─────────────────────────────────────────────────
  async getFlowStats(orgId: string) {
    const org = new Types.ObjectId(orgId);
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

  // ── Top contacts by message volume ─────────────────────────────────
  async getTopContacts(orgId: string, limit = 10) {
    const org = new Types.ObjectId(orgId);
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

  // ── Admin: platform-wide stats (super admin only) ──────────────────
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
}
