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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const pricing_service_1 = require("./pricing.service");
const pricing_dto_1 = require("./dto/pricing.dto");
let PricingController = class PricingController {
    pricingService;
    constructor(pricingService) {
        this.pricingService = pricingService;
    }
    getGlobalRates() {
        return this.pricingService.getGlobalRates();
    }
    updateGlobalRates(dto, adminId) {
        return this.pricingService.updateGlobalRates(dto, adminId);
    }
    setPlanPricing(planId, dto) {
        return this.pricingService.setPlanPricing(planId, dto);
    }
    getPlanPricing(planId) {
        return this.pricingService.getPlanPricing(planId);
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, common_1.Get)('rates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "getGlobalRates", null);
__decorate([
    (0, common_1.Put)('rates'),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pricing_dto_1.UpdatePricingDto, String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "updateGlobalRates", null);
__decorate([
    (0, common_1.Put)('plans/:planId'),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pricing_dto_1.UpdatePlanPricingDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "setPlanPricing", null);
__decorate([
    (0, common_1.Get)('plans/:planId'),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "getPlanPricing", null);
exports.PricingController = PricingController = __decorate([
    (0, swagger_1.ApiTags)('Pricing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('pricing'),
    __metadata("design:paramtypes", [pricing_service_1.PricingService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map