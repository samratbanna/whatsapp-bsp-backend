import { Model } from 'mongoose';
import { FlowDocument, FlowSessionDocument } from '../schemas/flow.schema';
import { MetaApiService } from '../../../common/services/meta-api.service';
import { WabaService } from '../../waba/waba.service';
export declare class FlowExecutor {
    private flowModel;
    private sessionModel;
    private metaApi;
    private wabaService;
    private readonly logger;
    constructor(flowModel: Model<FlowDocument>, sessionModel: Model<FlowSessionDocument>, metaApi: MetaApiService, wabaService: WabaService);
    processInbound(orgId: string, wabaDbId: string, message: any): Promise<void>;
    private continueFlow;
    private executeFromNode;
    private executeNode;
    private findMatchingFlow;
    private endSession;
    private interpolate;
}
