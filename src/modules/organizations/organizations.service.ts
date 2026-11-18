import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { WalletService } from '../wallet/wallet.service';
import { ALL_FEATURE_PERMISSIONS, OrgStatus, Role } from '../../common/enums';
import { UsersService } from '../users/users.service';

interface CreateOrganizationOptions {
  createAdminUser?: boolean;
  /** Onboard the new organization as a client of this reseller. */
  resellerId?: string;
  source?: 'admin' | 'self_signup' | 'reseller';
  /** Starting status. Defaults to trial. */
  status?: OrgStatus;
}

export type OrgKind = 'reseller' | 'client' | 'direct';

export interface OrgListFilter {
  status?: OrgStatus;
  kind?: OrgKind;
  resellerId?: string;
  search?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private walletService: WalletService,
    private usersService: UsersService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async create(
    dto: CreateOrganizationDto,
    options: CreateOrganizationOptions = {},
  ): Promise<OrganizationDocument> {
    const { createAdminUser = true } = options;

    if (createAdminUser && (!dto.ownerEmail || !dto.ownerPassword)) {
      throw new BadRequestException(
        'ownerEmail and ownerPassword are required while creating organization',
      );
    }

    const ownerEmail = dto.ownerEmail;
    const ownerPassword = dto.ownerPassword;

    // Fail before anything is written, rather than leave an orphan organization behind.
    if (createAdminUser && (await this.usersService.findByEmail(ownerEmail as string))) {
      throw new ConflictException('Email already registered');
    }

    let slug: string;
    if (dto.slug) {
      const existing = await this.orgModel.findOne({ slug: dto.slug });
      if (existing) throw new ConflictException('Organization slug already taken');
      slug = dto.slug;
    } else {
      // Self sign-ups and reseller clients pick names freely ("Acme" twice is normal), so an
      // auto-generated slug gets a suffix instead of failing.
      slug = await this.uniqueSlug(dto.name);
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const org = new this.orgModel({
      ...dto,
      slug,
      trialEndsAt,
      timezone: dto.timezone || 'Asia/Kolkata',
      reseller: options.resellerId ? new Types.ObjectId(options.resellerId) : null,
      source: options.source ?? (options.resellerId ? 'reseller' : 'admin'),
      ...(options.status ? { status: options.status } : {}),
    });

    const saved = await org.save();

    if (createAdminUser) {
      try {
        await this.usersService.create({
          name: dto.ownerName || `${dto.name} Admin`,
          email: ownerEmail as string,
          password: ownerPassword as string,
          role: Role.ORG_ADMIN,
          permissions: ALL_FEATURE_PERMISSIONS,
          organizationId: saved._id.toString(),
          phone: dto.contact,
        });
      } catch (error) {
        await saved.deleteOne();
        throw error;
      }
    }

    await this.walletService.initializeForOrg(saved._id.toString());

    return saved;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = this.generateSlug(name).slice(0, 40).replace(/^-+|-+$/g, '') || 'org';
    if (!(await this.orgModel.exists({ slug: base }))) return base;
    for (let i = 0; i < 5; i++) {
      const candidate = `${base}-${randomBytes(3).toString('hex')}`;
      if (!(await this.orgModel.exists({ slug: candidate }))) return candidate;
    }
    throw new ConflictException('Could not generate a unique organization slug, please retry');
  }

  async findAll(filter: OrgListFilter = {}): Promise<OrganizationDocument[]> {
    return this.orgModel
      .find(this.buildFilter(filter))
      .populate('reseller', 'name slug')
      .sort({ createdAt: -1 })
      .exec();
  }

  private buildFilter(filter: OrgListFilter): Record<string, any> {
    const q: Record<string, any> = {};
    if (filter.status) q.status = filter.status;
    if (filter.kind === 'reseller') q.isReseller = true;
    if (filter.kind === 'client') q.reseller = { $ne: null };
    if (filter.kind === 'direct') {
      q.isReseller = { $ne: true };
      q.reseller = null;
    }
    if (filter.resellerId) q.reseller = new Types.ObjectId(filter.resellerId);
    if (filter.search?.trim()) {
      const rx = new RegExp(escapeRegex(filter.search.trim()), 'i');
      q.$or = [{ name: rx }, { slug: rx }, { billingEmail: rx }, { phone: rx }];
    }
    return q;
  }

  // ── Reseller ───────────────────────────────────────────────────────

  /** Super admin turns reseller capability on or off for an organization. */
  async setReseller(id: string, enabled: boolean): Promise<OrganizationDocument> {
    const org = await this.findOne(id);
    if (enabled && org.reseller) {
      throw new BadRequestException(
        'This organization is a client of another reseller and cannot itself be a reseller',
      );
    }
    org.isReseller = enabled;
    // Turning it off keeps existing clients linked; the reseller just loses its panel. Turn it
    // back on and everything is where it was.
    return org.save();
  }

  /** Super admin moves a client to a reseller, or detaches it (resellerId = null). */
  async assignReseller(id: string, resellerId: string | null): Promise<OrganizationDocument> {
    const org = await this.findOne(id);
    if (resellerId === null) {
      org.reseller = null;
      return org.save();
    }
    if (resellerId === id) throw new BadRequestException('An organization cannot be its own reseller');
    if (org.isReseller) {
      throw new BadRequestException('A reseller cannot be a client of another reseller');
    }
    const reseller = await this.findOne(resellerId);
    if (!reseller.isReseller) throw new BadRequestException('Target organization is not a reseller');
    org.reseller = reseller._id as Types.ObjectId;
    return org.save();
  }

  async findClientsPage(
    resellerId: string,
    filter: Omit<OrgListFilter, 'resellerId' | 'kind'> & { page?: number; limit?: number },
  ) {
    const q = this.buildFilter({ ...filter, resellerId });
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const [data, total] = await Promise.all([
      this.orgModel.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.orgModel.countDocuments(q),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** A client of this reseller, or 404 — never reveals that another reseller's client exists. */
  async findClientOf(resellerId: string, clientId: string): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(clientId)) throw new NotFoundException('Client not found');
    const org = await this.orgModel.findOne({
      _id: new Types.ObjectId(clientId),
      reseller: new Types.ObjectId(resellerId),
    });
    if (!org) throw new NotFoundException('Client not found');
    return org;
  }

  async countClientsByStatus(resellerId: string): Promise<Record<string, number>> {
    const rows = await this.orgModel.aggregate([
      { $match: { reseller: new Types.ObjectId(resellerId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const out: Record<string, number> = { total: 0 };
    for (const r of rows) {
      out[r._id] = r.count;
      out.total += r.count;
    }
    return out;
  }

  async findOne(id: string): Promise<OrganizationDocument> {
    const org = await this.orgModel
      .findById(id)
      .exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string): Promise<OrganizationDocument> {
    const org = await this.orgModel.findOne({ slug }).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDocument> {
    const org = await this.orgModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async suspend(id: string): Promise<OrganizationDocument> {
    return this.update(id, { status: OrgStatus.SUSPENDED });
  }

  async activate(id: string): Promise<OrganizationDocument> {
    return this.update(id, { status: OrgStatus.ACTIVE });
  }

  async incrementMessageUsage(orgId: string, count = 1): Promise<void> {
    await this.orgModel.findByIdAndUpdate(orgId, {
      $inc: { messagesUsedThisMonth: count },
    });
  }

  async resetMonthlyUsage(): Promise<void> {
    await this.orgModel.updateMany(
      {},
      { messagesUsedThisMonth: 0, usageResetAt: new Date() },
    );
  }

  async remove(id: string): Promise<void> {
    const org = await this.orgModel.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    const clients = await this.orgModel.countDocuments({ reseller: org._id });
    if (clients > 0) {
      throw new ConflictException(
        `This reseller still has ${clients} client organization(s). Move or delete them first.`,
      );
    }
    await this.walletService.deleteForOrg(id);
    await org.deleteOne();
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
