import { FeaturePermission, Role, UserStatus } from '../../../common/enums';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role?: Role;
    organizationId?: string;
    phone?: string;
    permissions?: FeaturePermission[];
}
declare const UpdateUserDto_base: import("@nestjs/common").Type<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    status?: UserStatus;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
declare const CreateOrganizationUserDto_base: import("@nestjs/common").Type<Omit<CreateUserDto, "role" | "organizationId">>;
export declare class CreateOrganizationUserDto extends CreateOrganizationUserDto_base {
    role?: Role;
}
export declare class BulkCreateOrganizationUsersDto {
    users: CreateOrganizationUserDto[];
}
declare const UpdateOrganizationUserDto_base: import("@nestjs/common").Type<Partial<Omit<UpdateUserDto, "organizationId">>>;
export declare class UpdateOrganizationUserDto extends UpdateOrganizationUserDto_base {
}
export {};
