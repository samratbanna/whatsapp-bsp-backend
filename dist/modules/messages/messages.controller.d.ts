import { MessagesService } from './messages.service';
import { SendTextDto, SendTemplateDto, SendMediaDto, MessageQueryDto } from './dto/message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    sendText(orgId: string, dto: SendTextDto): Promise<import("./schemas/message.schema").MessageDocument>;
    sendTemplate(orgId: string, dto: SendTemplateDto): Promise<import("./schemas/message.schema").MessageDocument>;
    sendMedia(orgId: string, dto: SendMediaDto): Promise<import("./schemas/message.schema").MessageDocument>;
    findAll(orgId: string, query: MessageQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/message.schema").MessageDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/message.schema").Message & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getConversations(orgId: string, wabaId?: string): Promise<any[]>;
    getStats(orgId: string): Promise<{
        total: number;
        today: number;
        inbound: number;
        outbound: number;
        failed: number;
    }>;
}
