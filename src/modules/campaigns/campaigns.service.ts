import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model, Types } from 'mongoose';
import type { Queue } from 'bull';
import { Campaign, CampaignDocument, CampaignStatus } from './schemas/campaign.schema';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './dto/campaign.dto';
import { WabaService } from '../waba/waba.service';
import { CAMPAIGN_QUEUE } from './processors/campaign.processor';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectQueue(CAMPAIGN_QUEUE) private campaignQueue: Queue,
    private wabaService: WabaService,
  ) {}

  async create(orgId: string, dto: CreateCampaignDto): Promise<CampaignDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    if (!dto.contacts?.length && !dto.groups?.length) {
      throw new BadRequestException('Provide at least one contact or group');
    }

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
