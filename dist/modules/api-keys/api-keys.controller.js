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
exports.ApiKeysController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const api_keys_service_1 = require("./api-keys.service");
let ApiKeysController = class ApiKeysController {
    apiKeysService;
    constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
    }
    create(orgId, userId, dto) {
        return this.apiKeysService.create(orgId, userId, dto);
    }
    findAll(orgId) {
        return this.apiKeysService.findAll(orgId);
    }
    revoke(id, orgId) {
        return this.apiKeysService.revoke(id, orgId);
    }
    remove(id, orgId) {
        return this.apiKeysService.remove(id, orgId);
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, api_keys_service_1.CreateApiKeyDto]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/revoke'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "revoke", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ApiKeysController.prototype, "remove", null);
exports.ApiKeysController = ApiKeysController = __decorate([
    (0, swagger_1.ApiTags)('API Keys'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('api-keys'),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService])
], ApiKeysController);
//# sourceMappingURL=api-keys.controller.js.map