import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PricingRate, PricingRateDocument,
  PlanPricing, PlanPricingDocument,
  MessageCategory,
} from './schemas/pricing.schema';
import { UpdatePricingDto, UpdatePlanPricingDto } from './dto/pricing.dto';

@Injectable()
export class PricingService implements OnModuleInit {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectModel(PricingRate.name) private rateModel: Model<PricingRateDocument>,
    @InjectModel(PlanPricing.name) private planPricingModel: Model<PlanPricingDocument>,
  ) {}

  async onModuleInit() {
    const exists = await this.rateModel.findOne({ key: 'global' });
    if (!exists) {
      await this.rateModel.create({ key: 'global' });
      this.logger.log('✅ Default pricing rates initialized');
    }
  }

  // ── Get global rates ───────────────────────────────────────────────
  async getGlobalRates(): Promise<PricingRateDocument> {
    return (await this.rateModel.findOne({ key: 'global' }))!;
  }

  // ── Update global rates — recomputes effective ─────────────────────
  async updateGlobalRates(dto: UpdatePricingDto, adminId: string): Promise<PricingRateDocument> {
    const current = await this.getGlobalRates();

    const updated = {
      ...dto,
      marketingEffective: round2(
        (dto.marketingBase ?? current.marketingBase) +
        (dto.marketingMarkup ?? current.marketingMarkup),
      ),
      utilityEffective: round2(
        (dto.utilityBase ?? current.utilityBase) +
        (dto.utilityMarkup ?? current.utilityMarkup),
      ),
      authenticationEffective: round2(
        (dto.authenticationBase ?? current.authenticationBase) +
        (dto.authenticationMarkup ?? current.authenticationMarkup),
      ),
      serviceEffective: round2(
        (dto.serviceBase ?? current.serviceBase) +
        (dto.serviceMarkup ?? current.serviceMarkup),
      ),
      lastUpdatedBy: adminId,
    };

    return this.rateModel.findOneAndUpdate(
      { key: 'global' },
      { $set: updated },
      { new: true },
    ) as Promise<PricingRateDocument>;
  }

  // ── Per-plan override ──────────────────────────────────────────────
  async setPlanPricing(planId: string, dto: UpdatePlanPricingDto): Promise<PlanPricingDocument> {
    return this.planPricingModel.findOneAndUpdate(
      { plan: new Types.ObjectId(planId) },
      { $set: { ...dto, plan: new Types.ObjectId(planId) } },
      { new: true, upsert: true },
    );
  }

  async getPlanPricing(planId: string): Promise<PlanPricingDocument | null> {
    return this.planPricingModel.findOne({ plan: new Types.ObjectId(planId) });
  }

  // ── KEY METHOD: get effective charge per message ───────────────────
  // Used by WalletService before each send
  async getEffectiveRate(
    category: MessageCategory,
    planId?: string,
  ): Promise<number> {
    // 1. Check plan-specific override
    if (planId) {
      const planPricing = await this.planPricingModel.findOne({
        plan: new Types.ObjectId(planId),
      });
      if (planPricing) {
        const override = this.getRateFromDoc(planPricing as any, category);
        if (override !== undefined && override !== null) return override;
      }
    }

    // 2. Fall back to global effective rate
    const global = await this.getGlobalRates();
    return this.getRateFromDoc(global, category);
  }

  private getRateFromDoc(doc: any, category: MessageCategory): number {
    switch (category) {
      case MessageCategory.MARKETING:      return doc.marketingEffective ?? 1.00;
      case MessageCategory.UTILITY:        return doc.utilityEffective ?? 0.18;
      case MessageCategory.AUTHENTICATION: return doc.authenticationEffective ?? 0.18;
      case MessageCategory.SERVICE:        return doc.serviceEffective ?? 0;
      default: return 0;
    }
  }

  // ── Map template category to message category ──────────────────────
  static templateCategoryToMessageCategory(templateCategory: string): MessageCategory {
    switch (templateCategory?.toUpperCase()) {
      case 'MARKETING':      return MessageCategory.MARKETING;
      case 'UTILITY':        return MessageCategory.UTILITY;
      case 'AUTHENTICATION': return MessageCategory.AUTHENTICATION;
      default:               return MessageCategory.SERVICE;
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
