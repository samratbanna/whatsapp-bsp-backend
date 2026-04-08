import { PricingService } from './pricing.service';
import { UpdatePricingDto, UpdatePlanPricingDto } from './dto/pricing.dto';
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    getGlobalRates(): Promise<import("./schemas/pricing.schema").PricingRateDocument>;
    updateGlobalRates(dto: UpdatePricingDto, adminId: string): Promise<import("./schemas/pricing.schema").PricingRateDocument>;
    setPlanPricing(planId: string, dto: UpdatePlanPricingDto): Promise<import("./schemas/pricing.schema").PlanPricingDocument>;
    getPlanPricing(planId: string): Promise<import("./schemas/pricing.schema").PlanPricingDocument | null>;
}
