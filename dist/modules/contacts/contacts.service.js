"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContactsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const contact_schema_1 = require("./schemas/contact.schema");
let ContactsService = ContactsService_1 = class ContactsService {
    contactModel;
    groupModel;
    logger = new common_1.Logger(ContactsService_1.name);
    constructor(contactModel, groupModel) {
        this.contactModel = contactModel;
        this.groupModel = groupModel;
    }
    async create(orgId, dto) {
        const existing = await this.contactModel.findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
            phone: dto.phone,
        });
        if (existing)
            throw new common_1.ConflictException('Contact with this phone already exists');
        const groupIds = dto.groups?.map((g) => new mongoose_2.Types.ObjectId(g)) || [];
        const contact = await this.contactModel.create({
            ...dto,
            organization: new mongoose_2.Types.ObjectId(orgId),
            groups: groupIds,
        });
        if (groupIds.length) {
            await this.groupModel.updateMany({ _id: { $in: groupIds } }, { $inc: { contactCount: 1 } });
        }
        return contact;
    }
    async findAll(orgId, query) {
        const filter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { phone: { $regex: query.search } },
                { email: { $regex: query.search, $options: 'i' } },
            ];
        }
        if (query.groupId)
            filter.groups = new mongoose_2.Types.ObjectId(query.groupId);
        if (query.label)
            filter.labels = query.label;
        if (query.optedOut !== undefined)
            filter.optedOut = query.optedOut;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.contactModel
                .find(filter)
                .populate('groups', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.contactModel.countDocuments(filter),
        ]);
        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findOne(id, orgId) {
        const contact = await this.contactModel
            .findOne({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) })
            .populate('groups', 'name description')
            .exec();
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        return contact;
    }
    async findByPhone(phone, orgId) {
        return this.contactModel
            .findOne({ phone, organization: new mongoose_2.Types.ObjectId(orgId) })
            .exec();
    }
    async update(id, orgId, dto) {
        const contact = await this.contactModel
            .findOneAndUpdate({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) }, {
            ...dto,
            ...(dto.optedOut && { optedOutAt: new Date() }),
            groups: dto.groups?.map((g) => new mongoose_2.Types.ObjectId(g)),
        }, { new: true })
            .populate('groups', 'name')
            .exec();
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        return contact;
    }
    async remove(id, orgId) {
        const contact = await this.contactModel.findOne({
            _id: id,
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        if (contact.groups?.length) {
            await this.groupModel.updateMany({ _id: { $in: contact.groups } }, { $inc: { contactCount: -1 } });
        }
        await contact.deleteOne();
    }
    async bulkImport(orgId, dto) {
        let imported = 0;
        let skipped = 0;
        const errors = [];
        for (const c of dto.contacts) {
            try {
                await this.create(orgId, c);
                imported++;
            }
            catch (err) {
                if (err instanceof common_1.ConflictException) {
                    skipped++;
                }
                else {
                    errors.push(`${c.phone}: ${err.message}`);
                }
            }
        }
        return { imported, skipped, errors };
    }
    async optOut(phone, orgId) {
        await this.contactModel.findOneAndUpdate({ phone, organization: new mongoose_2.Types.ObjectId(orgId) }, { optedOut: true, optedOutAt: new Date() }, { upsert: true });
    }
    async createGroup(orgId, dto) {
        const existing = await this.groupModel.findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
            name: dto.name,
        });
        if (existing)
            throw new common_1.ConflictException('Group with this name already exists');
        return this.groupModel.create({
            ...dto,
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
    }
    async findAllGroups(orgId) {
        return this.groupModel
            .find({ organization: new mongoose_2.Types.ObjectId(orgId) })
            .sort({ name: 1 })
            .exec();
    }
    async findGroupContacts(groupId, orgId) {
        return this.contactModel
            .find({
            organization: new mongoose_2.Types.ObjectId(orgId),
            groups: new mongoose_2.Types.ObjectId(groupId),
            optedOut: false,
        })
            .select('phone name email labels')
            .exec();
    }
    async removeGroup(groupId, orgId) {
        const group = await this.groupModel.findOne({
            _id: groupId,
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.contactModel.updateMany({ groups: new mongoose_2.Types.ObjectId(groupId) }, { $pull: { groups: new mongoose_2.Types.ObjectId(groupId) } });
        await group.deleteOne();
    }
    async getStats(orgId) {
        const orgFilter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        const [total, optedOut, groups] = await Promise.all([
            this.contactModel.countDocuments(orgFilter),
            this.contactModel.countDocuments({ ...orgFilter, optedOut: true }),
            this.groupModel.countDocuments(orgFilter),
        ]);
        return { total, optedOut, active: total - optedOut, groups };
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = ContactsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(contact_schema_1.Contact.name)),
    __param(1, (0, mongoose_1.InjectModel)(contact_schema_1.ContactGroup.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map