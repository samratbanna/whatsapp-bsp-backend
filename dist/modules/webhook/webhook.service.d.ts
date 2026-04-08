import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { WabaService } from '../waba/waba.service';
import { MetaApiService } from '../../common/services/meta-api.service';
import { FlowExecutor } from '../flow-builder/executors/flow.executor';
import { InboxGateway } from '../inbox/gateways/inbox.gateway';
export declare class WebhookService {
    private config;
    private messagesService;
    private wabaService;
    private metaApi;
    private flowExecutor?;
    private inboxGateway?;
    private readonly logger;
    constructor(config: ConfigService, messagesService: MessagesService, wabaService: WabaService, metaApi: MetaApiService, flowExecutor?: FlowExecutor | undefined, inboxGateway?: InboxGateway | undefined);
    verifyToken(token: string): boolean;
    processEvent(body: any, signature: string, rawBody?: Buffer): Promise<void>;
    private processChange;
}
