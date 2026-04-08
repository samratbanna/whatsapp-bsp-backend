import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, ContactQueryDto, BulkImportDto, CreateGroupDto } from './dto/contact.dto';
export declare class ContactsController {
    private readonly contactsService;
    constructor(contactsService: ContactsService);
    create(orgId: string, dto: CreateContactDto): Promise<import("./schemas/contact.schema").ContactDocument>;
    bulkImport(orgId: string, dto: BulkImportDto): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
    findAll(orgId: string, query: ContactQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/contact.schema").ContactDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/contact.schema").Contact & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getStats(orgId: string): Promise<{
        total: number;
        optedOut: number;
        active: number;
        groups: number;
    }>;
    findOne(id: string, orgId: string): Promise<import("./schemas/contact.schema").ContactDocument>;
    update(id: string, orgId: string, dto: UpdateContactDto): Promise<import("./schemas/contact.schema").ContactDocument>;
    remove(id: string, orgId: string): Promise<void>;
    createGroup(orgId: string, dto: CreateGroupDto): Promise<import("./schemas/contact.schema").ContactGroupDocument>;
    findAllGroups(orgId: string): Promise<import("./schemas/contact.schema").ContactGroupDocument[]>;
    findGroupContacts(groupId: string, orgId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/contact.schema").ContactDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/contact.schema").Contact & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    removeGroup(groupId: string, orgId: string): Promise<void>;
}
