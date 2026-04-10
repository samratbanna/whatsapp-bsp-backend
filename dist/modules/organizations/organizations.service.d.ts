import { Model } from 'mongoose';
import { OrganizationDocument } from './schemas/organization.schema';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { WalletService } from '../wallet/wallet.service';
import { OrgStatus } from '../../common/enums';
import { UsersService } from '../users/users.service';
interface CreateOrganizationOptions {
    createAdminUser?: boolean;
}
export declare class OrganizationsService {
    private orgModel;
    private walletService;
    private usersService;
    constructor(orgModel: Model<OrganizationDocument>, walletService: WalletService, usersService: UsersService);
    private generateSlug;
    create(dto: CreateOrganizationDto, options?: CreateOrganizationOptions): Promise<OrganizationDocument>;
    findAll(status?: OrgStatus): Promise<OrganizationDocument[]>;
    findOne(id: string): Promise<OrganizationDocument>;
    findBySlug(slug: string): Promise<OrganizationDocument>;
    update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationDocument>;
    suspend(id: string): Promise<OrganizationDocument>;
    activate(id: string): Promise<OrganizationDocument>;
    incrementMessageUsage(orgId: string, count?: number): Promise<void>;
    resetMonthlyUsage(): Promise<void>;
    remove(id: string): Promise<void>;
}
export {};
