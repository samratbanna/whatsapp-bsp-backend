import { CampaignType } from '../schemas/campaign.schema';
export declare class CreateCampaignDto {
    name: string;
    type?: CampaignType;
    templateId: string;
    templateLanguage: string;
    templateVariables?: Record<string, string>;
    contacts?: string[];
    groups?: string[];
    scheduledAt?: string;
    messagesPerSecond?: number;
    wabaId?: string;
}
declare const UpdateCampaignDto_base: import("@nestjs/common").Type<Partial<CreateCampaignDto>>;
export declare class UpdateCampaignDto extends UpdateCampaignDto_base {
}
export declare class CampaignQueryDto {
    status?: string;
    page?: number;
    limit?: number;
}
export {};
