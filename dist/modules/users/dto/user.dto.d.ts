import { Role, UserStatus } from '../../../common/enums';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role?: Role;
    organizationId?: string;
    phone?: string;
}
declare const UpdateUserDto_base: import("@nestjs/common").Type<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    status?: UserStatus;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export {};
