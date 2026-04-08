import { Model, Types } from 'mongoose';
import { Contact, ContactDocument, ContactGroupDocument } from './schemas/contact.schema';
import { CreateContactDto, UpdateContactDto, ContactQueryDto, BulkImportDto, CreateGroupDto } from './dto/contact.dto';
export declare class ContactsService {
    private contactModel;
    private groupModel;
    private readonly logger;
    constructor(contactModel: Model<ContactDocument>, groupModel: Model<ContactGroupDocument>);
    create(orgId: string, dto: CreateContactDto): Promise<ContactDocument>;
    findAll(orgId: string, query: ContactQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, ContactDocument, {}, import("mongoose").DefaultSchemaOptions> & Contact & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
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
    findOne(id: string, orgId: string): Promise<ContactDocument>;
    findByPhone(phone: string, orgId: string): Promise<ContactDocument | null>;
    update(id: string, orgId: string, dto: UpdateContactDto): Promise<ContactDocument>;
    remove(id: string, orgId: string): Promise<void>;
    bulkImport(orgId: string, dto: BulkImportDto): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
    optOut(phone: string, orgId: string): Promise<void>;
    createGroup(orgId: string, dto: CreateGroupDto): Promise<ContactGroupDocument>;
    findAllGroups(orgId: string): Promise<ContactGroupDocument[]>;
    findGroupContacts(groupId: string, orgId: string): Promise<(import("mongoose").Document<unknown, {}, ContactDocument, {}, import("mongoose").DefaultSchemaOptions> & Contact & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    removeGroup(groupId: string, orgId: string): Promise<void>;
    getStats(orgId: string): Promise<{
        total: number;
        optedOut: number;
        active: number;
        groups: number;
    }>;
}
