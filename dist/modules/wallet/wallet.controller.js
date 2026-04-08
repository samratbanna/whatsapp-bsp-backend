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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const wallet_service_1 = require("./wallet.service");
const wallet_dto_1 = require("./dto/wallet.dto");
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    getMyWallet(orgId) {
        return this.walletService.getOrCreate(orgId);
    }
    getCredits(orgId) {
        return this.walletService.getCredits(orgId);
    }
    getSummary(orgId) {
        return this.walletService.getUsageSummary(orgId);
    }
    getTransactions(orgId, query) {
        return this.walletService.getTransactions(orgId, query);
    }
    updateSettings(orgId, dto) {
        return this.walletService.updateSettings(orgId, dto);
    }
    getAllWallets() {
        return this.walletService.getAllWallets();
    }
    getOrgWallet(orgId) {
        return this.walletService.getOrCreate(orgId);
    }
    getOrgSummary(orgId) {
        return this.walletService.getUsageSummary(orgId);
    }
    getOrgTransactions(orgId, query) {
        return this.walletService.getTransactions(orgId, query);
    }
    addCredits(orgId, dto, adminId) {
        return this.walletService.addCredits(orgId, dto, adminId);
    }
    bulkAddCredits(orgId, dto, adminId) {
        return this.walletService.bulkAddCredits(orgId, dto, adminId);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Get)('credits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getCredits", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_dto_1.WalletTxQueryDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_dto_1.UpdateWalletSettingsDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getAllWallets", null);
__decorate([
    (0, common_1.Get)('admin/:orgId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getOrgWallet", null);
__decorate([
    (0, common_1.Get)('admin/:orgId/summary'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getOrgSummary", null);
__decorate([
    (0, common_1.Get)('admin/:orgId/transactions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('orgId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_dto_1.WalletTxQueryDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getOrgTransactions", null);
__decorate([
    (0, common_1.Post)('admin/:orgId/add-credits'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('orgId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_dto_1.AddCreditsDto, String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "addCredits", null);
__decorate([
    (0, common_1.Post)('admin/:orgId/bulk-add'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('orgId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_dto_1.BulkAddCreditsDto, String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "bulkAddCredits", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map