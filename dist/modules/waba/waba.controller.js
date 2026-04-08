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
exports.WabaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const waba_service_1 = require("./waba.service");
const waba_dto_1 = require("./dto/waba.dto");
let WabaController = class WabaController {
    wabaService;
    constructor(wabaService) {
        this.wabaService = wabaService;
    }
    connect(orgId, dto) {
        return this.wabaService.connect(orgId, dto);
    }
    findAll(orgId) {
        return this.wabaService.findByOrg(orgId);
    }
    findOne(id, orgId) {
        return this.wabaService.findOne(id, orgId);
    }
    update(id, orgId, dto) {
        return this.wabaService.update(id, orgId, dto);
    }
    disconnect(id, orgId) {
        return this.wabaService.disconnect(id, orgId);
    }
    remove(id, orgId) {
        return this.wabaService.remove(id, orgId);
    }
    assignShared(dto) {
        return this.wabaService.assignShared(dto);
    }
};
exports.WabaController = WabaController;
__decorate([
    (0, common_1.Post)('connect'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, waba_dto_1.ConnectWabaDto]),
    __metadata("design:returntype", void 0)
], WabaController.prototype, "connect", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN, enums_1.Role.AGENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WabaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WabaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, waba_dto_1.UpdateWabaDto]),
    __metadata("design:returntype", void 0)
], WabaController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/disconnect'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WabaController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WabaController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('admin/assign-shared'),
    (0, roles_decorator_1.Roles)(enums_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [waba_dto_1.AssignSharedWabaDto]),
    __metadata("design:returntype", void 0)
], WabaController.prototype, "assignShared", null);
exports.WabaController = WabaController = __decorate([
    (0, swagger_1.ApiTags)('WABA'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('waba'),
    __metadata("design:paramtypes", [waba_service_1.WabaService])
], WabaController);
//# sourceMappingURL=waba.controller.js.map