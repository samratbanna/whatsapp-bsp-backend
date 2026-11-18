import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RateSettings,
  RateSettingsDocument,
} from './schemas/rate-settings.schema';
import { RatesDto, UpdateRateSettingsDto } from './dto/rates.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { OrganizationDocument } from '../organizations/schemas/organization.schema';
import { WalletCategory } from '../wallet/schemas/wallet.schema';
import { CATEGORIES, Rates, emptyRates, readRates } from './rates.util';

export interface Settings {
  defaultRates: Rates;
  gstPercent: number;
  minPurchase: number;
}

/** Where an organization's rate for a category comes from. */
export type RateSource = 'custom' | 'default' | 'unset';

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(
    @InjectModel(RateSettings.name)
    private settingsModel: Model<RateSettingsDocument>,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ── Global settings ────────────────────────────────────────────────
  async getSettings(): Promise<Settings> {
    const doc = await this.settingsModel
      .findOneAndUpdate(
        { key: 'global' },
        { $setOnInsert: { key: 'global' } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean()
      .exec();
    return {
      defaultRates: readRates(doc?.defaultRates),
      gstPercent: doc?.gstPercent ?? 18,
      minPurchase: doc?.minPurchase ?? 100,
    };
  }

  async updateSettings(
    dto: UpdateRateSettingsDto,
    adminId: string,
  ): Promise<Settings> {
    await this.getSettings(); // make sure the document exists
    const $set: Record<string, any> = { updatedBy: adminId };
    for (const c of CATEGORIES) {
      const v = dto.defaultRates?.[c];
      if (v !== undefined) $set[`defaultRates.${c}`] = v ?? null;
    }
    if (dto.gstPercent !== undefined) $set.gstPercent = dto.gstPercent;
    if (dto.minPurchase !== undefined) $set.minPurchase = dto.minPurchase;
    await this.settingsModel.updateOne({ key: 'global' }, { $set });
    this.logger.log(
      `Rate settings updated by ${adminId}: ${JSON.stringify($set)}`,
    );
    return this.getSettings();
  }

  // ── Per organization ───────────────────────────────────────────────
  /**
   * What the organization pays now. Direct customers and resellers fall back to the default
   * rate; a reseller's client only ever pays what its reseller set.
   */
  async effectiveRates(
    org: OrganizationDocument,
    settings?: Settings,
  ): Promise<{ rates: Rates; source: Record<WalletCategory, RateSource> }> {
    const own = readRates(org.rates);
    const isClient = !!org.reseller;
    const defaults = isClient
      ? emptyRates()
      : (settings ?? (await this.getSettings())).defaultRates;

    const rates = emptyRates();
    const source = {} as Record<WalletCategory, RateSource>;
    for (const c of CATEGORIES) {
      if (own[c] != null) {
        rates[c] = own[c];
        source[c] = 'custom';
      } else if (defaults[c] != null) {
        rates[c] = defaults[c];
        source[c] = 'default';
      } else {
        source[c] = 'unset';
      }
    }
    return { rates, source };
  }

  /** Super admin's view of one organization's rates. */
  async orgRates(orgId: string) {
    const org = await this.orgsService.findOne(orgId);
    const settings = await this.getSettings();
    const { rates, source } = await this.effectiveRates(org, settings);

    let reseller: { id: string; name: string; rates: Rates } | null = null;
    if (org.reseller) {
      const r = await this.orgsService
        .findOne(org.reseller.toString())
        .catch(() => null);
      if (r) {
        reseller = {
          id: r._id.toString(),
          name: r.name,
          rates: (await this.effectiveRates(r, settings)).rates,
        };
      }
    }
    return {
      own: readRates(org.rates),
      effective: rates,
      source,
      defaults: settings.defaultRates,
      gstPercent: settings.gstPercent,
      isResellerClient: !!org.reseller,
      reseller,
    };
  }

  async setOrgRates(orgId: string, dto: RatesDto) {
    await this.orgsService.setRates(orgId, dto);
    return this.orgRates(orgId);
  }
}
