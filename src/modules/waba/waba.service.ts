import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Waba, WabaDocument, WabaStatus, WabaOwnershipType } from './schemas/waba.schema';
import { ConnectWabaDto, UpdateWabaDto, AssignSharedWabaDto } from './dto/waba.dto';
import { MetaApiService } from '../../common/services/meta-api.service';

@Injectable()
export class WabaService {
  private readonly logger = new Logger(WabaService.name);

  constructor(
    @InjectModel(Waba.name) private wabaModel: Model<WabaDocument>,
    private metaApi: MetaApiService,
  ) {}

  async connect(orgId: string, dto: ConnectWabaDto): Promise<WabaDocument> {
    const phoneInfo = await this.metaApi.getPhoneNumberInfo(
      dto.phoneNumberId,
      dto.accessToken,
    );

    // Exchange the submitted token for a long-lived (~60 day) token immediately.
    let resolvedToken = dto.accessToken;
    let tokenIssuedAt = new Date();
    try {
      const refreshed = await this.metaApi.exchangeForLongLivedToken(dto.accessToken, dto.appId, dto.appSecret);
      resolvedToken = refreshed.token;
      tokenIssuedAt = new Date();
    } catch (e: any) {
      // If the exchange fails the token may already be long-lived or a system
      // user token — store it as-is and let it fail at send time if invalid.
    }

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
      accessToken: resolvedToken,
      appSecret: dto.appSecret,
      tokenIssuedAt,
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

    // Exchange for a long-lived token immediately.
    let resolvedToken = dto.accessToken;
    let tokenIssuedAt = new Date();
    try {
      const refreshed = await this.metaApi.exchangeForLongLivedToken(dto.accessToken, dto.appId, dto.appSecret);
      resolvedToken = refreshed.token;
      tokenIssuedAt = new Date();
    } catch (e: any) {
      // Already long-lived / system user token — keep as-is.
    }

    await this.wabaModel.updateMany(
      { organization: new Types.ObjectId(dto.orgId) },
      { isDefault: false },
    );

    const waba = new this.wabaModel({
      organization: new Types.ObjectId(dto.orgId),
      ownershipType: WabaOwnershipType.SHARED,
      wabaId: dto.wabaId,
      phoneNumberId: dto.phoneNumberId,
      accessToken: resolvedToken,
      appSecret: dto.appSecret,
      tokenIssuedAt,
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
      .select('+accessToken +appSecret')
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

  /** Directly overwrites the stored access token and stamps the issue timestamp. */
  async updateAccessToken(wabaId: string, newToken: string): Promise<void> {
    await this.wabaModel.updateOne(
      { _id: wabaId },
      { accessToken: newToken, tokenIssuedAt: new Date() },
    );
  }

  /** Marks the WABA as DISCONNECTED when the Meta token is permanently expired. */
  async markTokenExpired(wabaId: string): Promise<void> {
    await this.wabaModel.updateOne(
      { _id: wabaId },
      { status: WabaStatus.DISCONNECTED },
    );
  }

  /**
   * Proactive token refresh — runs daily at 03:00.
   * Refreshes tokens for all ACTIVE WABAs whose token was issued more than 50 days ago
   * (Meta long-lived tokens last ~60 days; refreshing at 50 days gives a 10-day safety window).
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async proactiveTokenRefresh(): Promise<void> {
    const fiftyDaysAgo = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);

    const stalWabas = await this.wabaModel
      .find({
        status: WabaStatus.ACTIVE,
        $or: [
          { tokenIssuedAt: { $lte: fiftyDaysAgo } },
          { tokenIssuedAt: { $exists: false } },
        ],
      })
      .select('+accessToken')
      .exec();

    if (!stalWabas.length) {
      this.logger.log('Proactive token refresh: no stale tokens found');
      return;
    }

    this.logger.log(`Proactive token refresh: checking ${stalWabas.length} WABA(s) with tokens ≥50 days old`);

    for (const waba of stalWabas) {
      try {
        const { token } = await this.metaApi.exchangeForLongLivedToken(waba.accessToken);
        await this.updateAccessToken(waba._id.toString(), token);
        this.logger.log(
          `Proactive token refresh: refreshed WABA ${waba._id} (phoneNumberId=${waba.phoneNumberId})`,
        );
      } catch (err: any) {
        if (this.metaApi.isTokenExpiredError(err)) {
          this.logger.error(
            `Proactive token refresh: WABA ${waba._id} token is fully expired — marking DISCONNECTED`,
          );
          await this.markTokenExpired(waba._id.toString());
        } else {
          this.logger.warn(
            `Proactive token refresh: failed for WABA ${waba._id} — ${err?.message ?? err}`,
          );
        }
      }
    }
  }
}
