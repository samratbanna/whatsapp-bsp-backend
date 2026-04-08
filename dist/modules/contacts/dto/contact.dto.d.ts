export declare class CreateContactDto {
    phone: string;
    name?: string;
    email?: string;
    groups?: string[];
    customFields?: Record<string, string>;
    labels?: string[];
    notes?: string;
}
declare const UpdateContactDto_base: import("@nestjs/common").Type<Partial<CreateContactDto>>;
export declare class UpdateContactDto extends UpdateContactDto_base {
    optedOut?: boolean;
}
export declare class BulkImportDto {
    contacts: CreateContactDto[];
}
export declare class ContactQueryDto {
    search?: string;
    groupId?: string;
    label?: string;
    optedOut?: boolean;
    page?: number;
    limit?: number;
}
export declare class CreateGroupDto {
    name: string;
    description?: string;
}
export {};
