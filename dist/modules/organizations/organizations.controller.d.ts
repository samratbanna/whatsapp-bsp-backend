import { OrgStatus } from '../../common/enums';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
export declare class OrganizationsController {
    private readonly orgsService;
    constructor(orgsService: OrganizationsService);
    create(dto: CreateOrganizationDto): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    findAll(status?: OrgStatus): Promise<import("./schemas/organization.schema").OrganizationDocument[]>;
    findOne(id: string): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    update(id: string, dto: UpdateOrganizationDto): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    suspend(id: string): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    activate(id: string): Promise<import("./schemas/organization.schema").OrganizationDocument>;
    remove(id: string): Promise<void>;
}
