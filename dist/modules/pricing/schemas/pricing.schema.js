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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanPricingSchema = exports.PlanPricing = exports.PricingRateSchema = exports.PricingRate = exports.MessageCategory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var MessageCategory;
(function (MessageCategory) {
    MessageCategory["MARKETING"] = "marketing";
    MessageCategory["UTILITY"] = "utility";
    MessageCategory["AUTHENTICATION"] = "authentication";
    MessageCategory["SERVICE"] = "service";
})(MessageCategory || (exports.MessageCategory = MessageCategory = {}));
let PricingRate = class PricingRate {
    key;
    marketingBase;
    utilityBase;
    authenticationBase;
    serviceBase;
    marketingMarkup;
    utilityMarkup;
    authenticationMarkup;
    serviceMarkup;
    marketingEffective;
    utilityEffective;
    authenticationEffective;
    serviceEffective;
    lastUpdatedBy;
};
exports.PricingRate = PricingRate;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, default: 'global' }),
    __metadata("design:type", String)
], PricingRate.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.88 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "marketingBase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.13 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "utilityBase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.13 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "authenticationBase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "serviceBase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.12 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "marketingMarkup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.05 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "utilityMarkup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.05 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "authenticationMarkup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "serviceMarkup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1.00 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "marketingEffective", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.18 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "utilityEffective", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0.18 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "authenticationEffective", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PricingRate.prototype, "serviceEffective", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", String)
], PricingRate.prototype, "lastUpdatedBy", void 0);
exports.PricingRate = PricingRate = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PricingRate);
exports.PricingRateSchema = mongoose_1.SchemaFactory.createForClass(PricingRate);
let PlanPricing = class PlanPricing {
    plan;
    marketingEffective;
    utilityEffective;
    authenticationEffective;
    serviceEffective;
};
exports.PlanPricing = PlanPricing;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Plan', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PlanPricing.prototype, "plan", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PlanPricing.prototype, "marketingEffective", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PlanPricing.prototype, "utilityEffective", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PlanPricing.prototype, "authenticationEffective", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PlanPricing.prototype, "serviceEffective", void 0);
exports.PlanPricing = PlanPricing = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PlanPricing);
exports.PlanPricingSchema = mongoose_1.SchemaFactory.createForClass(PlanPricing);
//# sourceMappingURL=pricing.schema.js.map