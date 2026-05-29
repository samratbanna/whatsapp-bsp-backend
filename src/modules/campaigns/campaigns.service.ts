import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model, Types } from 'mongoose';
import type { Queue } from 'bull';
import { Campaign, CampaignDocument, CampaignStatus } from './schemas/campaign.schema';
import { Message, MessageDocument, MessageStatus } from '../messages/schemas/message.schema';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto, CampaignOverviewQueryDto } from './dto/campaign.dto';
import { WabaService } from '../waba/waba.service';
import { CAMPAIGN_QUEUE } from './processors/campaign.processor';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectQueue(CAMPAIGN_QUEUE) private campaignQueue: Queue,
    private wabaService: WabaService,
  ) {}

  async create(orgId: string, dto: CreateCampaignDto): Promise<CampaignDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    const campaign = await this.campaignModel.create({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      name: dto.name,
      type: dto.type,
      template: new Types.ObjectId(dto.templateId),
      templateLanguage: dto.templateLanguage,
      templateVariables: dto.templateVariables || {},
      contacts: dto.contacts?.map((id) => new Types.ObjectId(id)) || [],
      groups: dto.groups?.map((id) => new Types.ObjectId(id)) || [],
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      messagesPerSecond: dto.messagesPerSecond || 10,
      status: CampaignStatus.DRAFT,
    });

    // Auto-launch immediately after creation (scheduledAt still respected via queue delay).
    return this.launch((campaign._id as Types.ObjectId).toString(), orgId);
  }

  async launch(id: string, orgId: string): Promise<CampaignDocument> {
    const campaign = await this.findOne(id, orgId);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException(`Campaign is already ${campaign.status}`);
    }

    const delay = campaign.scheduledAt
      ? Math.max(0, campaign.scheduledAt.getTime() - Date.now())
      : 0;

    this.logger.log(`[Campaign] Adding job to queue: campaignId=${id}, delay=${delay}ms`);
    let job: any;
    try {
      job = await this.campaignQueue.add(
        'broadcast',
        { campaignId: id, orgId },
        {
          delay,
          attempts: 1,
          removeOnComplete: false,
          removeOnFail: false,
        },
      );
      this.logger.log(`[Campaign] Job added to queue: jobId=${job.id}`);
    } catch (queueErr: any) {
      this.logger.error(`[Campaign] Failed to add job to queue: ${queueErr.message}`, queueErr.stack);
      throw queueErr;
    }

    campaign.status = delay > 0 ? CampaignStatus.SCHEDULED : CampaignStatus.RUNNING;
    campaign.jobId = job.id as string;
    return campaign.save();
  }

  async resume(id: string, orgId: string): Promise<CampaignDocument> {
    const campaign = await this.findOne(id, orgId);

    const resumable = [CampaignStatus.PAUSED, CampaignStatus.FAILED, CampaignStatus.COMPLETED];
    if (!resumable.includes(campaign.status)) {
      throw new BadRequestException('Only paused, failed, or incomplete campaigns can be resumed');
    }

    // For truly completed campaigns (all messages sent), block resume
    if (
      campaign.status === CampaignStatus.COMPLETED &&
      campaign.totalCount > 0 &&
      campaign.sentCount + campaign.failedCount >= campaign.totalCount
    ) {
      throw new BadRequestException('Campaign has already sent all messages');
    }

    // For old records without resumeFromIndex tracking, infer from counts
    if (!campaign.resumeFromIndex && campaign.sentCount + campaign.failedCount > 0) {
      campaign.resumeFromIndex = campaign.sentCount + campaign.failedCount;
    }

    const job = await this.campaignQueue.add(
      'broadcast',
      { campaignId: id, orgId },
      {
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    campaign.status = CampaignStatus.RUNNING;
    campaign.jobId = job.id as string;
    campaign.failureReason = undefined;
    return campaign.save();
  }

  async pause(id: string, orgId: string): Promise<CampaignDocument> {
    const campaign = await this.findOne(id, orgId);
    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Only running campaigns can be paused');
    }
    campaign.status = CampaignStatus.PAUSED;
    return campaign.save();
  }

  async cancel(id: string, orgId: string): Promise<CampaignDocument> {
    const campaign = await this.findOne(id, orgId);
    if ([CampaignStatus.COMPLETED, CampaignStatus.FAILED].includes(campaign.status)) {
      throw new BadRequestException('Cannot cancel a completed or failed campaign');
    }

    // Remove from queue if still pending
    if (campaign.jobId) {
      const job = await this.campaignQueue.getJob(campaign.jobId);
      if (job) await job.remove();
    }

    campaign.status = CampaignStatus.CANCELLED;
    return campaign.save();
  }

  async findAll(orgId: string, query: CampaignQueryDto) {
    const filter: any = { organization: new Types.ObjectId(orgId) };
    if (query.status) filter.status = query.status;

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

  async getOverview(orgId: string, query: CampaignOverviewQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { organization: new Types.ObjectId(orgId) };
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const [campaigns, total] = await Promise.all([
      this.campaignModel
        .find(filter)
        .populate('template', 'name category')
        .populate('waba', 'displayPhoneNumber verifiedName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.campaignModel.countDocuments(filter),
    ]);

    const campaignIds = campaigns.map((c) => c._id);

    const msgStats = campaignIds.length
      ? await this.messageModel.aggregate([
          { $match: { campaign: { $in: campaignIds } } },
          {
            $group: {
              _id: { campaign: '$campaign', status: '$status' },
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    const countsMap = new Map<string, Record<string, number>>();
    for (const row of msgStats) {
      const key = row._id.campaign.toString();
      if (!countsMap.has(key)) countsMap.set(key, {});
      countsMap.get(key)![row._id.status] = row.count;
    }

    const defaultCounts = { total: 0, queued: 0, sent: 0, delivered: 0, read: 0, failed: 0, success: 0 };

    const data = campaigns.map((c) => {
      const raw = countsMap.get((c._id as Types.ObjectId).toString()) ?? {};
      const queued = raw['queued'] ?? 0;
      const sent = raw['sent'] ?? 0;
      const delivered = raw['delivered'] ?? 0;
      const read = raw['read'] ?? 0;
      const failed = raw['failed'] ?? 0;
      const success = sent + delivered + read;
      return {
        ...c,
        messageCounts: {
          total: queued + sent + delivered + read + failed,
          queued,
          sent,
          delivered,
          read,
          failed,
          success,
        },
      };
    });

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, orgId: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel
      .findOne({ _id: id, organization: new Types.ObjectId(orgId) })
      .populate('template', 'name category components')
      .populate('waba', 'displayPhoneNumber')
      .exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, orgId: string, dto: UpdateCampaignDto): Promise<CampaignDocument> {
    const campaign = await this.findOne(id, orgId);
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be edited');
    }
    Object.assign(campaign, dto);
    return campaign.save();
  }

  async remove(id: string, orgId: string): Promise<void> {
    const campaign = await this.findOne(id, orgId);
    if (campaign.status === CampaignStatus.RUNNING) {
      throw new BadRequestException('Cannot delete a running campaign');
    }
    await campaign.deleteOne();
  }

  async getCampaignReportStats(id: string, orgId: string) {
    const campaign = await this.campaignModel
      .findOne({ _id: id, organization: new Types.ObjectId(orgId) })
      .populate('template', 'name')
      .exec();
    if (!campaign) throw new NotFoundException('Campaign not found');

    const campaignObjId = new Types.ObjectId(id);

    const counts = await this.messageModel.aggregate([
      { $match: { campaign: campaignObjId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap: Record<string, number> = {};
    counts.forEach((c) => { statusMap[c._id] = c.count; });

    const sent = statusMap[MessageStatus.SENT] ?? 0;
    const delivered = statusMap[MessageStatus.DELIVERED] ?? 0;
    const read = statusMap[MessageStatus.READ] ?? 0;
    const failed = statusMap[MessageStatus.FAILED] ?? 0;
    const queued = statusMap[MessageStatus.QUEUED] ?? 0;
    const total = sent + delivered + read + failed + queued;
    const success = sent + delivered + read;

    return {
      campaignId: id,
      campaignName: campaign.name,
      status: campaign.status,
      template: (campaign.template as any)?.name ?? '',
      startedAt: campaign.startedAt ?? null,
      completedAt: campaign.completedAt ?? null,
      total,
      success,
      sent,
      delivered,
      read,
      failed,
      queued,
    };
  }

  async generateReport(id: string, orgId: string): Promise<Buffer> {
    const campaign = await this.campaignModel
      .findOne({ _id: id, organization: new Types.ObjectId(orgId) })
      .populate('template', 'name')
      .exec();
    if (!campaign) throw new NotFoundException('Campaign not found');

    const campaignObjId = new Types.ObjectId(id);

    const [stats, failedMessages] = await Promise.all([
      this.messageModel.aggregate([
        { $match: { campaign: campaignObjId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.messageModel
        .find({ campaign: campaignObjId, status: MessageStatus.FAILED })
        .select('to failureReason failedAt')
        .sort({ failedAt: 1 })
        .lean()
        .exec(),
    ]);

    const statusMap: Record<string, number> = {};
    stats.forEach((c) => { statusMap[c._id] = c.count; });

    const sent = statusMap[MessageStatus.SENT] ?? 0;
    const delivered = statusMap[MessageStatus.DELIVERED] ?? 0;
    const read = statusMap[MessageStatus.READ] ?? 0;
    const failed = statusMap[MessageStatus.FAILED] ?? 0;
    const queued = statusMap[MessageStatus.QUEUED] ?? 0;

    const ExcelJS = await import('exceljs');
    const WorkbookClass = (ExcelJS as any).default?.Workbook ?? (ExcelJS as any).Workbook;
    const workbook = new WorkbookClass();

    // ── Summary sheet ──────────────────────────────────────────────────
    const summary = workbook.addWorksheet('Summary');
    summary.columns = [
      { header: 'Field', key: 'field', width: 25 },
      { header: 'Value', key: 'value', width: 40 },
    ];
    summary.getRow(1).font = { bold: true };

    const templateName = (campaign.template as any)?.name ?? '';
    const summaryRows = [
      ['Campaign Name', campaign.name],
      ['Status', campaign.status],
      ['Template', templateName],
      ['Total', sent + delivered + read + failed + queued],
      ['Success (Sent + Delivered + Read)', sent + delivered + read],
      ['Sent', sent],
      ['Delivered', delivered],
      ['Read', read],
      ['Failed', failed],
      ['Queued', queued],
      ['Started At', campaign.startedAt?.toISOString() ?? '—'],
      ['Completed At', campaign.completedAt?.toISOString() ?? '—'],
    ];
    summaryRows.forEach(([field, value]) => summary.addRow({ field, value }));

    // ── Failed messages sheet ──────────────────────────────────────────
    const failedSheet = workbook.addWorksheet('Failed Messages');
    failedSheet.columns = [
      { header: '#', key: 'index', width: 6 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Failure Reason', key: 'reason', width: 70 },
      { header: 'Failed At', key: 'failedAt', width: 25 },
    ];
    failedSheet.getRow(1).font = { bold: true };

    failedMessages.forEach((msg, i) => {
      failedSheet.addRow({
        index: i + 1,
        phone: msg.to,
        reason: msg.failureReason ?? '—',
        failedAt: msg.failedAt ? new Date(msg.failedAt).toISOString() : '—',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getStats(orgId: string) {
    const orgFilter = { organization: new Types.ObjectId(orgId) };
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
    }, {} as Record<string, any>);
  }
}
