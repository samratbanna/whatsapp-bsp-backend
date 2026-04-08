import { OrgStatus } from '../../../common/enums';
export declare class CreateOrganizationDto {
    name: string;
    slug?: string;
    logo?: string;
    website?: string;
    billingEmail?: string;
    phone?: string;
    address?: string;
    country?: string;
    timezone?: string;
}
declare const UpdateOrganizationDto_base: import("@nestjs/common").Type<Partial<CreateOrganizationDto>>;
export declare class UpdateOrganizationDto extends UpdateOrganizationDto_base {
    status?: OrgStatus;
}
export {};
