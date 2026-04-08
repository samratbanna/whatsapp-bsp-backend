import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact, ContactDocument, ContactGroup, ContactGroupDocument } from './schemas/contact.schema';
import {
  CreateContactDto, UpdateContactDto, ContactQueryDto,
  BulkImportDto, CreateGroupDto,
} from './dto/contact.dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    @InjectModel(ContactGroup.name) private groupModel: Model<ContactGroupDocument>,
  ) {}

  // ── Contacts CRUD ──────────────────────────────────────────────────

  async create(orgId: string, dto: CreateContactDto): Promise<ContactDocument> {
    const existing = await this.contactModel.findOne({
      organization: new Types.ObjectId(orgId),
      phone: dto.phone,
    });
    if (existing) throw new ConflictException('Contact with this phone already exists');

    const groupIds = dto.groups?.map((g) => new Types.ObjectId(g)) || [];

    const contact = await this.contactModel.create({
      ...dto,
      organization: new Types.ObjectId(orgId),
      groups: groupIds,
    });

    // Increment group counts
    if (groupIds.length) {
      await this.groupModel.updateMany(
        { _id: { $in: groupIds } },
        { $inc: { contactCount: 1 } },
      );
    }

    return contact;
  }

  async findAll(orgId: string, query: ContactQueryDto) {
    const filter: any = { organization: new Types.ObjectId(orgId) };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.groupId) filter.groups = new Types.ObjectId(query.groupId);
    if (query.label) filter.labels = query.label;
    if (query.optedOut !== undefined) filter.optedOut = query.optedOut;

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

  async findOne(id: string, orgId: string): Promise<ContactDocument> {
    const contact = await this.contactModel
      .findOne({ _id: id, organization: new Types.ObjectId(orgId) })
      .populate('groups', 'name description')
      .exec();
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async findByPhone(phone: string, orgId: string): Promise<ContactDocument | null> {
    return this.contactModel
      .findOne({ phone, organization: new Types.ObjectId(orgId) })
      .exec();
  }

  async update(id: string, orgId: string, dto: UpdateContactDto): Promise<ContactDocument> {
    const contact = await this.contactModel
      .findOneAndUpdate(
        { _id: id, organization: new Types.ObjectId(orgId) },
        {
          ...dto,
          ...(dto.optedOut && { optedOutAt: new Date() }),
          groups: dto.groups?.map((g) => new Types.ObjectId(g)),
        },
        { new: true },
      )
      .populate('groups', 'name')
      .exec();
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async remove(id: string, orgId: string): Promise<void> {
    const contact = await this.contactModel.findOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (!contact) throw new NotFoundException('Contact not found');

    // Decrement group counts
    if (contact.groups?.length) {
      await this.groupModel.updateMany(
        { _id: { $in: contact.groups } },
        { $inc: { contactCount: -1 } },
      );
    }

    await contact.deleteOne();
  }

  // ── Bulk import ────────────────────────────────────────────────────
  async bulkImport(
    orgId: string,
    dto: BulkImportDto,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const c of dto.contacts) {
      try {
        await this.create(orgId, c);
        imported++;
      } catch (err) {
        if (err instanceof ConflictException) {
          skipped++;
        } else {
          errors.push(`${c.phone}: ${err.message}`);
        }
      }
    }

    return { imported, skipped, errors };
  }

  // ── Opt-out ────────────────────────────────────────────────────────
  async optOut(phone: string, orgId: string): Promise<void> {
    await this.contactModel.findOneAndUpdate(
      { phone, organization: new Types.ObjectId(orgId) },
      { optedOut: true, optedOutAt: new Date() },
      { upsert: true },
    );
  }

  // ── Groups CRUD ────────────────────────────────────────────────────
  async createGroup(orgId: string, dto: CreateGroupDto): Promise<ContactGroupDocument> {
    const existing = await this.groupModel.findOne({
      organization: new Types.ObjectId(orgId),
      name: dto.name,
    });
    if (existing) throw new ConflictException('Group with this name already exists');

    return this.groupModel.create({
      ...dto,
      organization: new Types.ObjectId(orgId),
    });
  }

  async findAllGroups(orgId: string): Promise<ContactGroupDocument[]> {
    return this.groupModel
      .find({ organization: new Types.ObjectId(orgId) })
      .sort({ name: 1 })
      .exec();
  }

  async findGroupContacts(groupId: string, orgId: string) {
    return this.contactModel
      .find({
        organization: new Types.ObjectId(orgId),
        groups: new Types.ObjectId(groupId),
        optedOut: false,
      })
      .select('phone name email labels')
      .exec();
  }

  async removeGroup(groupId: string, orgId: string): Promise<void> {
    const group = await this.groupModel.findOne({
      _id: groupId,
      organization: new Types.ObjectId(orgId),
    });
    if (!group) throw new NotFoundException('Group not found');

    // Remove group reference from all contacts
    await this.contactModel.updateMany(
      { groups: new Types.ObjectId(groupId) },
      { $pull: { groups: new Types.ObjectId(groupId) } },
    );

    await group.deleteOne();
  }

  // ── Stats ──────────────────────────────────────────────────────────
  async getStats(orgId: string) {
    const orgFilter = { organization: new Types.ObjectId(orgId) };
    const [total, optedOut, groups] = await Promise.all([
      this.contactModel.countDocuments(orgFilter),
      this.contactModel.countDocuments({ ...orgFilter, optedOut: true }),
      this.groupModel.countDocuments(orgFilter),
    ]);
    return { total, optedOut, active: total - optedOut, groups };
  }
}
