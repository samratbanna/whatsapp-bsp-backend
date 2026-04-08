import { Model } from 'mongoose';
import { TemplateDocument } from './schemas/template.schema';
import { CreateTemplateDto, TemplateQueryDto } from './dto/template.dto';
import { WabaService } from '../waba/waba.service';
import { MetaApiService } from '../../common/services/meta-api.service';
export declare class TemplatesService {
    private templateModel;
    private wabaService;
    private metaApi;
    private readonly logger;
    constructor(templateModel: Model<TemplateDocument>, wabaService: WabaService, metaApi: MetaApiService);
    private extractVariables;
    create(orgId: string, dto: CreateTemplateDto): Promise<TemplateDocument>;
    syncFromMeta(orgId: string, wabaId?: string): Promise<{
        synced: number;
    }>;
    findAll(orgId: string, query: TemplateQueryDto): Promise<TemplateDocument[]>;
    findOne(id: string, orgId: string): Promise<TemplateDocument>;
    remove(id: string, orgId: string): Promise<void>;
}
