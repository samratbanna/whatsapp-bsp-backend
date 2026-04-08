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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getDashboard(orgId) {
        return this.analyticsService.getDashboard(orgId);
    }
    getMessagesByDay(orgId, days) {
        return this.analyticsService.getMessagesByDay(orgId, days || 30);
    }
    getCampaignStats(orgId, campaignId) {
        return this.analyticsService.getCampaignStats(orgId, campaignId);
    }
    getContactGrowth(orgId, days) {
        return this.analyticsService.getContactGrowth(orgId, days || 30);
    }
    getFlowStats(orgId) {
        return this.analyticsService.getFlowStats(orgId);
    }
    getTopContacts(orgId, limit) {
        return this.analyticsService.getTopContacts(orgId, limit || 10);
    }
    getPlatformStats() {
        return this.analyticsService.getPlatformStats();
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('messages/by-day'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getMessagesByDay", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getCampaignStats", null);
__decorate([
    (0, common_1.Get)('contacts/growth'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getContactGrowth", null);
__decorate([
    (0, common_1.Get)('flows'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getFlowStats", null);
__decorate([
    (0, common_1.Get)('contacts/top'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTopContacts", null);
__decorate([
    (0, common_1.Get)('platform'),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getPlatformStats", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map