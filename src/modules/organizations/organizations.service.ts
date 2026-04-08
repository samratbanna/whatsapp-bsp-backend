import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { WalletService } from '../wallet/wallet.service';
import { OrgStatus } from '../../common/enums';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private walletService: WalletService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async create(dto: CreateOrganizationDto): Promise<OrganizationDocument> {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.orgModel.findOne({ slug });
    if (existing) throw new ConflictException('Organization slug already taken');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const org = new this.orgModel({
      ...dto,
      slug,
      trialEndsAt,
      timezone: dto.timezone || 'Asia/Kolkata',
    });

    const saved = await org.save();
    await this.walletService.initializeForOrg(saved._id.toString());
    return saved;
  }

  async findAll(status?: OrgStatus): Promise<OrganizationDocument[]> {
    const filter = status ? { status } : {};
    return this.orgModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
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
    await org.deleteOne();
  }
}
