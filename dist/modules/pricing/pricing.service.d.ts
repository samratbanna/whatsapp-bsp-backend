import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { PricingRateDocument, PlanPricingDocument, MessageCategory } from './schemas/pricing.schema';
import { UpdatePricingDto, UpdatePlanPricingDto } from './dto/pricing.dto';
export declare class PricingService implements OnModuleInit {
    private rateModel;
    private planPricingModel;
    private readonly logger;
    constructor(rateModel: Model<PricingRateDocument>, planPricingModel: Model<PlanPricingDocument>);
    onModuleInit(): Promise<void>;
    getGlobalRates(): Promise<PricingRateDocument>;
    updateGlobalRates(dto: UpdatePricingDto, adminId: string): Promise<PricingRateDocument>;
    setPlanPricing(planId: string, dto: UpdatePlanPricingDto): Promise<PlanPricingDocument>;
    getPlanPricing(planId: string): Promise<PlanPricingDocument | null>;
    getEffectiveRate(category: MessageCategory, planId?: string): Promise<number>;
    private getRateFromDoc;
    static templateCategoryToMessageCategory(templateCategory: string): MessageCategory;
}
