import { Model } from 'mongoose';
import { WabaDocument } from './schemas/waba.schema';
import { ConnectWabaDto, UpdateWabaDto, AssignSharedWabaDto } from './dto/waba.dto';
import { MetaApiService } from '../../common/services/meta-api.service';
export declare class WabaService {
    private wabaModel;
    private metaApi;
    private readonly logger;
    constructor(wabaModel: Model<WabaDocument>, metaApi: MetaApiService);
    connect(orgId: string, dto: ConnectWabaDto): Promise<WabaDocument>;
    assignShared(dto: AssignSharedWabaDto): Promise<WabaDocument>;
    findByOrg(orgId: string): Promise<WabaDocument[]>;
    findAll(): Promise<WabaDocument[]>;
    findOne(id: string, orgId?: string): Promise<WabaDocument>;
    findDefaultForOrg(orgId: string): Promise<WabaDocument | null>;
    findByPhoneNumberId(phoneNumberId: string): Promise<WabaDocument | null>;
    update(id: string, orgId: string, dto: UpdateWabaDto): Promise<WabaDocument>;
    disconnect(id: string, orgId: string): Promise<WabaDocument>;
    remove(id: string, orgId: string): Promise<void>;
    updateAccessToken(wabaId: string, newToken: string): Promise<void>;
    markTokenExpired(wabaId: string): Promise<void>;
    proactiveTokenRefresh(): Promise<void>;
}
