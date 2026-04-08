import { WabaService } from './waba.service';
import { ConnectWabaDto, UpdateWabaDto, AssignSharedWabaDto } from './dto/waba.dto';
export declare class WabaController {
    private readonly wabaService;
    constructor(wabaService: WabaService);
    connect(orgId: string, dto: ConnectWabaDto): Promise<import("./schemas/waba.schema").WabaDocument>;
    findAll(orgId: string): Promise<import("./schemas/waba.schema").WabaDocument[]>;
    findOne(id: string, orgId: string): Promise<import("./schemas/waba.schema").WabaDocument>;
    update(id: string, orgId: string, dto: UpdateWabaDto): Promise<import("./schemas/waba.schema").WabaDocument>;
    disconnect(id: string, orgId: string): Promise<import("./schemas/waba.schema").WabaDocument>;
    remove(id: string, orgId: string): Promise<void>;
    assignShared(dto: AssignSharedWabaDto): Promise<import("./schemas/waba.schema").WabaDocument>;
}
