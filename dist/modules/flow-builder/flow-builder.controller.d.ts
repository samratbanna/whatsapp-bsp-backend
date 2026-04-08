import { FlowBuilderService } from './flow-builder.service';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';
export declare class FlowBuilderController {
    private readonly flowService;
    constructor(flowService: FlowBuilderService);
    create(orgId: string, dto: CreateFlowDto): Promise<import("./schemas/flow.schema").FlowDocument>;
    findAll(orgId: string, status?: string): Promise<import("./schemas/flow.schema").FlowDocument[]>;
    getActiveSessions(orgId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/flow.schema").FlowSessionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/flow.schema").FlowSession & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    findOne(id: string, orgId: string): Promise<import("./schemas/flow.schema").FlowDocument>;
    update(id: string, orgId: string, dto: UpdateFlowDto): Promise<import("./schemas/flow.schema").FlowDocument>;
    activate(id: string, orgId: string): Promise<import("./schemas/flow.schema").FlowDocument>;
    deactivate(id: string, orgId: string): Promise<import("./schemas/flow.schema").FlowDocument>;
    duplicate(id: string, orgId: string): Promise<import("./schemas/flow.schema").FlowDocument>;
    remove(id: string, orgId: string): Promise<void>;
}
