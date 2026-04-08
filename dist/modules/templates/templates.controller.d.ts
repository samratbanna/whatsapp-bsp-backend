import { TemplatesService } from './templates.service';
import { CreateTemplateDto, TemplateQueryDto } from './dto/template.dto';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    create(orgId: string, dto: CreateTemplateDto): Promise<import("./schemas/template.schema").TemplateDocument>;
    sync(orgId: string, wabaId?: string): Promise<{
        synced: number;
    }>;
    findAll(orgId: string, query: TemplateQueryDto): Promise<import("./schemas/template.schema").TemplateDocument[]>;
    findOne(id: string, orgId: string): Promise<import("./schemas/template.schema").TemplateDocument>;
    remove(id: string, orgId: string): Promise<void>;
}
