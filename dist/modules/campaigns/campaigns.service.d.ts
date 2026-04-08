import { Model, Types } from 'mongoose';
import type { Queue } from 'bull';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './dto/campaign.dto';
import { WabaService } from '../waba/waba.service';
export declare class CampaignsService {
    private campaignModel;
    private campaignQueue;
    private wabaService;
    private readonly logger;
    constructor(campaignModel: Model<CampaignDocument>, campaignQueue: Queue, wabaService: WabaService);
    create(orgId: string, dto: CreateCampaignDto): Promise<CampaignDocument>;
    launch(id: string, orgId: string): Promise<CampaignDocument>;
    pause(id: string, orgId: string): Promise<CampaignDocument>;
    cancel(id: string, orgId: string): Promise<CampaignDocument>;
    findAll(orgId: string, query: CampaignQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & Campaign & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    findOne(id: string, orgId: string): Promise<CampaignDocument>;
    update(id: string, orgId: string, dto: UpdateCampaignDto): Promise<CampaignDocument>;
    remove(id: string, orgId: string): Promise<void>;
    getStats(orgId: string): Promise<any>;
}
