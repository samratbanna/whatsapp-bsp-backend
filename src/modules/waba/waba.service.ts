import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Waba, WabaDocument, WabaStatus, WabaOwnershipType } from './schemas/waba.schema';
import { ConnectWabaDto, UpdateWabaDto, AssignSharedWabaDto } from './dto/waba.dto';
import { MetaApiService } from '../../common/services/meta-api.service';

@Injectable()
export class WabaService {
  constructor(
    @InjectModel(Waba.name) private wabaModel: Model<WabaDocument>,
    private metaApi: MetaApiService,
  ) {}

  async connect(orgId: string, dto: ConnectWabaDto): Promise<WabaDocument> {
    const phoneInfo = await this.metaApi.getPhoneNumberInfo(
      dto.phoneNumberId,
      dto.accessToken,
    );

    if (dto.isDefault !== false) {
      await this.wabaModel.updateMany(
        { organization: new Types.ObjectId(orgId) },
        { isDefault: false },
      );
    }

    // BYO: wallet billing disabled by default (Meta bills them directly)
    // SHARED: wallet billing enabled (we bill them)
    const walletBillingEnabled = dto.walletBillingEnabled !== undefined
      ? dto.walletBillingEnabled
      : dto.ownershipType === WabaOwnershipType.SHARED;

    const waba = new this.wabaModel({
      organization: new Types.ObjectId(orgId),
      ownershipType: dto.ownershipType || WabaOwnershipType.BYO,
      wabaId: dto.wabaId,
      phoneNumberId: dto.phoneNumberId,
      accessToken: dto.accessToken,
      displayPhoneNumber: phoneInfo.display_phone_number,
      verifiedName: phoneInfo.verified_name,
      qualityRating: phoneInfo.quality_rating,
      label: dto.label,
      poolLabel: dto.poolLabel,
      isDefault: dto.isDefault !== false,
      walletBillingEnabled,
      status: WabaStatus.ACTIVE,
    });

    return waba.save();
  }

  // Super admin assigns BSP-owned shared WABA to an org
  async assignShared(dto: AssignSharedWabaDto): Promise<WabaDocument> {
    const phoneInfo = await this.metaApi.getPhoneNumberInfo(
      dto.phoneNumberId,
      dto.accessToken,
    );

    await this.wabaModel.updateMany(
      { organization: new Types.ObjectId(dto.orgId) },
      { isDefault: false },
    );

    const waba = new this.wabaModel({
      organization: new Types.ObjectId(dto.orgId),
      ownershipType: WabaOwnershipType.SHARED,
      wabaId: dto.wabaId,
      phoneNumberId: dto.phoneNumberId,
      accessToken: dto.accessToken,
      displayPhoneNumber: phoneInfo.display_phone_number,
      verifiedName: phoneInfo.verified_name,
      qualityRating: phoneInfo.quality_rating,
      label: dto.label || 'Shared BSP Number',
      poolLabel: dto.poolLabel,
      isDefault: true,
      walletBillingEnabled: true, // always true for shared
      status: WabaStatus.ACTIVE,
    });

    return waba.save();
  }

  async findByOrg(orgId: string): Promise<WabaDocument[]> {
    return this.wabaModel
      .find({ organization: new Types.ObjectId(orgId) })
      .select('-accessToken')
      .exec();
  }

  async findAll(): Promise<WabaDocument[]> {
    return this.wabaModel
      .find()
      .select('-accessToken')
      .exec();
  }

  async findOne(id: string, orgId?: string): Promise<WabaDocument> {
    const filter: any = { _id: id };
    if (orgId) filter.organization = new Types.ObjectId(orgId);

    const waba = await this.wabaModel.findOne(filter).select('+accessToken').exec();
    if (!waba) throw new NotFoundException('WABA not found');
    return waba;
  }

  async findDefaultForOrg(orgId: string): Promise<WabaDocument | null> {
    return this.wabaModel
      .findOne({
        organization: new Types.ObjectId(orgId),
        isDefault: true,
        status: WabaStatus.ACTIVE,
      })
      .select('+accessToken')
      .exec();
  }

  async findByPhoneNumberId(phoneNumberId: string): Promise<WabaDocument | null> {
    return this.wabaModel
      .findOne({ phoneNumberId })
      .select('+accessToken')
      .exec();
  }

  async update(id: string, orgId: string, dto: UpdateWabaDto): Promise<WabaDocument> {
    const waba = await this.wabaModel.findOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (!waba) throw new NotFoundException('WABA not found');

    if (dto.isDefault) {
      await this.wabaModel.updateMany(
        { organization: new Types.ObjectId(orgId), _id: { $ne: id } },
        { isDefault: false },
      );
    }

    Object.assign(waba, dto);
    return waba.save();
  }

  async disconnect(id: string, orgId: string): Promise<WabaDocument> {
    const waba = await this.wabaModel.findOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (!waba) throw new NotFoundException('WABA not found');
    waba.status = WabaStatus.DISCONNECTED;
    return waba.save();
  }

  async remove(id: string, orgId: string): Promise<void> {
    const result = await this.wabaModel.deleteOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('WABA not found');
  }
}
