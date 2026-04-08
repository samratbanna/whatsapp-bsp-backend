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
exports.FlowBuilderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const flow_builder_service_1 = require("./flow-builder.service");
const flow_dto_1 = require("./dto/flow.dto");
let FlowBuilderController = class FlowBuilderController {
    flowService;
    constructor(flowService) {
        this.flowService = flowService;
    }
    create(orgId, dto) {
        return this.flowService.create(orgId, dto);
    }
    findAll(orgId, status) {
        return this.flowService.findAll(orgId, status);
    }
    getActiveSessions(orgId) {
        return this.flowService.getActiveSessions(orgId);
    }
    findOne(id, orgId) {
        return this.flowService.findOne(id, orgId);
    }
    update(id, orgId, dto) {
        return this.flowService.update(id, orgId, dto);
    }
    activate(id, orgId) {
        return this.flowService.activate(id, orgId);
    }
    deactivate(id, orgId) {
        return this.flowService.deactivate(id, orgId);
    }
    duplicate(id, orgId) {
        return this.flowService.duplicate(id, orgId);
    }
    remove(id, orgId) {
        return this.flowService.remove(id, orgId);
    }
};
exports.FlowBuilderController = FlowBuilderController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, flow_dto_1.CreateFlowDto]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, flow_dto_1.UpdateFlowDto]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FlowBuilderController.prototype, "remove", null);
exports.FlowBuilderController = FlowBuilderController = __decorate([
    (0, swagger_1.ApiTags)('Flow Builder'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('flows'),
    __metadata("design:paramtypes", [flow_builder_service_1.FlowBuilderService])
], FlowBuilderController);
//# sourceMappingURL=flow-builder.controller.js.map