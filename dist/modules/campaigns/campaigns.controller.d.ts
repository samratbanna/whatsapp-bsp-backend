import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './dto/campaign.dto';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    create(orgId: string, dto: CreateCampaignDto): Promise<import("./schemas/campaign.schema").CampaignDocument>;
    findAll(orgId: string, query: CampaignQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/campaign.schema").CampaignDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/campaign.schema").Campaign & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
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
    getStats(orgId: string): Promise<any>;
    findOne(id: string, orgId: string): Promise<import("./schemas/campaign.schema").CampaignDocument>;
    update(id: string, orgId: string, dto: UpdateCampaignDto): Promise<import("./schemas/campaign.schema").CampaignDocument>;
    launch(id: string, orgId: string): Promise<import("./schemas/campaign.schema").CampaignDocument>;
    pause(id: string, orgId: string): Promise<import("./schemas/campaign.schema").CampaignDocument>;
    cancel(id: string, orgId: string): Promise<import("./schemas/campaign.schema").CampaignDocument>;
    remove(id: string, orgId: string): Promise<void>;
}
