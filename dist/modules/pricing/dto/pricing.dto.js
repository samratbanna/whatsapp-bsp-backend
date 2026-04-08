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
exports.UpdatePlanPricingDto = exports.UpdatePricingDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdatePricingDto {
    marketingBase;
    utilityBase;
    authenticationBase;
    serviceBase;
    marketingMarkup;
    utilityMarkup;
    authenticationMarkup;
    serviceMarkup;
}
exports.UpdatePricingDto = UpdatePricingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.88 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "marketingBase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.13 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "utilityBase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.13 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "authenticationBase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "serviceBase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.12 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "marketingMarkup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.05 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "utilityMarkup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.05 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "authenticationMarkup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePricingDto.prototype, "serviceMarkup", void 0);
class UpdatePlanPricingDto {
    marketingEffective;
    utilityEffective;
    authenticationEffective;
    serviceEffective;
}
exports.UpdatePlanPricingDto = UpdatePlanPricingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlanPricingDto.prototype, "marketingEffective", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlanPricingDto.prototype, "utilityEffective", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlanPricingDto.prototype, "authenticationEffective", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlanPricingDto.prototype, "serviceEffective", void 0);
//# sourceMappingURL=pricing.dto.js.map