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
var PricingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pricing_schema_1 = require("./schemas/pricing.schema");
let PricingService = PricingService_1 = class PricingService {
    rateModel;
    planPricingModel;
    logger = new common_1.Logger(PricingService_1.name);
    constructor(rateModel, planPricingModel) {
        this.rateModel = rateModel;
        this.planPricingModel = planPricingModel;
    }
    async onModuleInit() {
        const exists = await this.rateModel.findOne({ key: 'global' });
        if (!exists) {
            await this.rateModel.create({ key: 'global' });
            this.logger.log('✅ Default pricing rates initialized');
        }
    }
    async getGlobalRates() {
        return (await this.rateModel.findOne({ key: 'global' }));
    }
    async updateGlobalRates(dto, adminId) {
        const current = await this.getGlobalRates();
        const updated = {
            ...dto,
            marketingEffective: round2((dto.marketingBase ?? current.marketingBase) +
                (dto.marketingMarkup ?? current.marketingMarkup)),
            utilityEffective: round2((dto.utilityBase ?? current.utilityBase) +
                (dto.utilityMarkup ?? current.utilityMarkup)),
            authenticationEffective: round2((dto.authenticationBase ?? current.authenticationBase) +
                (dto.authenticationMarkup ?? current.authenticationMarkup)),
            serviceEffective: round2((dto.serviceBase ?? current.serviceBase) +
                (dto.serviceMarkup ?? current.serviceMarkup)),
            lastUpdatedBy: adminId,
        };
        return this.rateModel.findOneAndUpdate({ key: 'global' }, { $set: updated }, { new: true });
    }
    async setPlanPricing(planId, dto) {
        return this.planPricingModel.findOneAndUpdate({ plan: new mongoose_2.Types.ObjectId(planId) }, { $set: { ...dto, plan: new mongoose_2.Types.ObjectId(planId) } }, { new: true, upsert: true });
    }
    async getPlanPricing(planId) {
        return this.planPricingModel.findOne({ plan: new mongoose_2.Types.ObjectId(planId) });
    }
    async getEffectiveRate(category, planId) {
        if (planId) {
            const planPricing = await this.planPricingModel.findOne({
                plan: new mongoose_2.Types.ObjectId(planId),
            });
            if (planPricing) {
                const override = this.getRateFromDoc(planPricing, category);
                if (override !== undefined && override !== null)
                    return override;
            }
        }
        const global = await this.getGlobalRates();
        return this.getRateFromDoc(global, category);
    }
    getRateFromDoc(doc, category) {
        switch (category) {
            case pricing_schema_1.MessageCategory.MARKETING: return doc.marketingEffective ?? 1.00;
            case pricing_schema_1.MessageCategory.UTILITY: return doc.utilityEffective ?? 0.18;
            case pricing_schema_1.MessageCategory.AUTHENTICATION: return doc.authenticationEffective ?? 0.18;
            case pricing_schema_1.MessageCategory.SERVICE: return doc.serviceEffective ?? 0;
            default: return 0;
        }
    }
    static templateCategoryToMessageCategory(templateCategory) {
        switch (templateCategory?.toUpperCase()) {
            case 'MARKETING': return pricing_schema_1.MessageCategory.MARKETING;
            case 'UTILITY': return pricing_schema_1.MessageCategory.UTILITY;
            case 'AUTHENTICATION': return pricing_schema_1.MessageCategory.AUTHENTICATION;
            default: return pricing_schema_1.MessageCategory.SERVICE;
        }
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = PricingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(pricing_schema_1.PricingRate.name)),
    __param(1, (0, mongoose_1.InjectModel)(pricing_schema_1.PlanPricing.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], PricingService);
function round2(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=pricing.service.js.map