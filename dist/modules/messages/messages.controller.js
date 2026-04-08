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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const messages_service_1 = require("./messages.service");
const message_dto_1 = require("./dto/message.dto");
let MessagesController = class MessagesController {
    messagesService;
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    sendText(orgId, dto) {
        return this.messagesService.sendText(orgId, dto);
    }
    sendTemplate(orgId, dto) {
        return this.messagesService.sendTemplate(orgId, dto);
    }
    sendMedia(orgId, dto) {
        return this.messagesService.sendMedia(orgId, dto);
    }
    findAll(orgId, query) {
        return this.messagesService.findAll(orgId, query);
    }
    getConversations(orgId, wabaId) {
        return this.messagesService.getConversations(orgId, wabaId);
    }
    getStats(orgId) {
        return this.messagesService.getStats(orgId);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Post)('send/text'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.SendTextDto]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "sendText", null);
__decorate([
    (0, common_1.Post)('send/template'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.SendTemplateDto]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "sendTemplate", null);
__decorate([
    (0, common_1.Post)('send/media'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.SendMediaDto]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "sendMedia", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.MessageQueryDto]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)('wabaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getStats", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('Messages'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN, enums_1.Role.AGENT),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map