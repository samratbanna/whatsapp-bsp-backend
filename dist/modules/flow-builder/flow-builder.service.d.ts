import { Model, Types } from 'mongoose';
import { FlowDocument, FlowSession, FlowSessionDocument } from './schemas/flow.schema';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';
import { WabaService } from '../waba/waba.service';
export declare class FlowBuilderService {
    private flowModel;
    private sessionModel;
    private wabaService;
    constructor(flowModel: Model<FlowDocument>, sessionModel: Model<FlowSessionDocument>, wabaService: WabaService);
    create(orgId: string, dto: CreateFlowDto): Promise<FlowDocument>;
    findAll(orgId: string, status?: string): Promise<FlowDocument[]>;
    findOne(id: string, orgId: string): Promise<FlowDocument>;
    update(id: string, orgId: string, dto: UpdateFlowDto): Promise<FlowDocument>;
    activate(id: string, orgId: string): Promise<FlowDocument>;
    deactivate(id: string, orgId: string): Promise<FlowDocument>;
    remove(id: string, orgId: string): Promise<void>;
    duplicate(id: string, orgId: string): Promise<FlowDocument>;
    getActiveSessions(orgId: string): Promise<(import("mongoose").Document<unknown, {}, FlowSessionDocument, {}, import("mongoose").DefaultSchemaOptions> & FlowSession & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
}
