import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendTextDto, SendTemplateDto, SendMediaDto, MessageQueryDto } from './dto/message.dto';
import { WabaService } from '../waba/waba.service';
import { MetaApiService } from '../../common/services/meta-api.service';
import { WalletService } from '../wallet/wallet.service';
export declare class MessagesService {
    private messageModel;
    private wabaService;
    private metaApi;
    private walletService;
    private readonly logger;
    constructor(messageModel: Model<MessageDocument>, wabaService: WabaService, metaApi: MetaApiService, walletService: WalletService);
    sendText(orgId: string, dto: SendTextDto): Promise<MessageDocument>;
    sendTemplate(orgId: string, dto: SendTemplateDto): Promise<MessageDocument>;
    sendMedia(orgId: string, dto: SendMediaDto): Promise<MessageDocument>;
    storeInbound(orgId: string, wabaId: string, rawMessage: any): Promise<MessageDocument>;
    updateStatus(metaMessageId: string, status: string, timestamp?: number, errorData?: any, orgId?: string): Promise<void>;
    findAll(orgId: string, query: MessageQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, MessageDocument, {}, import("mongoose").DefaultSchemaOptions> & Message & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getConversations(orgId: string, wabaId?: string): Promise<any[]>;
    getStats(orgId: string): Promise<{
        total: number;
        today: number;
        inbound: number;
        outbound: number;
        failed: number;
    }>;
}
