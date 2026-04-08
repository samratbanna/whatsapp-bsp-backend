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
exports.ContactsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const contacts_service_1 = require("./contacts.service");
const contact_dto_1 = require("./dto/contact.dto");
let ContactsController = class ContactsController {
    contactsService;
    constructor(contactsService) {
        this.contactsService = contactsService;
    }
    create(orgId, dto) {
        return this.contactsService.create(orgId, dto);
    }
    bulkImport(orgId, dto) {
        return this.contactsService.bulkImport(orgId, dto);
    }
    findAll(orgId, query) {
        return this.contactsService.findAll(orgId, query);
    }
    getStats(orgId) {
        return this.contactsService.getStats(orgId);
    }
    findOne(id, orgId) {
        return this.contactsService.findOne(id, orgId);
    }
    update(id, orgId, dto) {
        return this.contactsService.update(id, orgId, dto);
    }
    remove(id, orgId) {
        return this.contactsService.remove(id, orgId);
    }
    createGroup(orgId, dto) {
        return this.contactsService.createGroup(orgId, dto);
    }
    findAllGroups(orgId) {
        return this.contactsService.findAllGroups(orgId);
    }
    findGroupContacts(groupId, orgId) {
        return this.contactsService.findGroupContacts(groupId, orgId);
    }
    removeGroup(groupId, orgId) {
        return this.contactsService.removeGroup(groupId, orgId);
    }
};
exports.ContactsController = ContactsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contact_dto_1.CreateContactDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contact_dto_1.BulkImportDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contact_dto_1.ContactQueryDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, contact_dto_1.UpdateContactDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('groups'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contact_dto_1.CreateGroupDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)('groups/all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findAllGroups", null);
__decorate([
    (0, common_1.Get)('groups/:groupId/contacts'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findGroupContacts", null);
__decorate([
    (0, common_1.Delete)('groups/:groupId'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "removeGroup", null);
exports.ContactsController = ContactsController = __decorate([
    (0, swagger_1.ApiTags)('Contacts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.ORG_ADMIN, enums_1.Role.SUPER_ADMIN, enums_1.Role.AGENT),
    (0, common_1.Controller)('contacts'),
    __metadata("design:paramtypes", [contacts_service_1.ContactsService])
], ContactsController);
//# sourceMappingURL=contacts.controller.js.map