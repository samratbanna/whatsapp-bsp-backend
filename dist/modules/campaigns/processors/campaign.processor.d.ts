import { Model } from 'mongoose';
import type { Job } from 'bull';
import { CampaignDocument } from '../schemas/campaign.schema';
import { ContactDocument } from '../../contacts/schemas/contact.schema';
import { WabaService } from '../../waba/waba.service';
import { MetaApiService } from '../../../common/services/meta-api.service';
import { MessagesService } from '../../messages/messages.service';
import { WalletService } from '../../wallet/wallet.service';
export declare const CAMPAIGN_QUEUE = "campaign";
export interface CampaignJobData {
    campaignId: string;
    orgId: string;
}
export declare class CampaignProcessor {
    private campaignModel;
    private contactModel;
    private wabaService;
    private metaApi;
    private messagesService;
    private walletService;
    private readonly logger;
    constructor(campaignModel: Model<CampaignDocument>, contactModel: Model<ContactDocument>, wabaService: WabaService, metaApi: MetaApiService, messagesService: MessagesService, walletService: WalletService);
    handleBroadcast(job: Job<CampaignJobData>): Promise<void>;
    private collectPhones;
    private resolveVariables;
    private sleep;
}
