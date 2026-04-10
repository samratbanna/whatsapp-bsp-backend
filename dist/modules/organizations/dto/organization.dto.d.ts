import { OrgStatus } from '../../../common/enums';
declare class InvoiceBusinessDetailsDto {
    legalBusinessName?: string;
    tradeName?: string;
    gstin?: string;
    pan?: string;
    cin?: string;
    udyamNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
    contactEmail?: string;
    contactPhone?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    bankBranch?: string;
}
declare class LoginUserDetailsDto {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
    designation?: string;
}
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
    businessDetails?: InvoiceBusinessDetailsDto;
    loginUserDetails?: LoginUserDetailsDto;
    ownerName?: string;
    ownerEmail?: string;
    ownerPassword?: string;
    contact?: string;
}
declare const UpdateOrganizationDto_base: import("@nestjs/common").Type<Partial<CreateOrganizationDto>>;
export declare class UpdateOrganizationDto extends UpdateOrganizationDto_base {
    status?: OrgStatus;
}
export {};
