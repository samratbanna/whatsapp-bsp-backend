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
exports.CreateGroupDto = exports.ContactQueryDto = exports.BulkImportDto = exports.UpdateContactDto = exports.CreateContactDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateContactDto {
    phone;
    name;
    email;
    groups;
    customFields;
    labels;
    notes;
}
exports.CreateContactDto = CreateContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '919876543210', description: 'Phone without + prefix' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{7,15}$/, { message: 'Phone must be 7-15 digits without + prefix' }),
    __metadata("design:type", String)
], CreateContactDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Group IDs' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateContactDto.prototype, "groups", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Object }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateContactDto.prototype, "customFields", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateContactDto.prototype, "labels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "notes", void 0);
class UpdateContactDto extends (0, swagger_1.PartialType)(CreateContactDto) {
    optedOut;
}
exports.UpdateContactDto = UpdateContactDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateContactDto.prototype, "optedOut", void 0);
class BulkImportDto {
    contacts;
}
exports.BulkImportDto = BulkImportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [CreateContactDto],
        description: 'Array of contacts to import',
    }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BulkImportDto.prototype, "contacts", void 0);
class ContactQueryDto {
    search;
    groupId;
    label;
    optedOut;
    page;
    limit;
}
exports.ContactQueryDto = ContactQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ContactQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ContactQueryDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ContactQueryDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ContactQueryDto.prototype, "optedOut", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    __metadata("design:type", Number)
], ContactQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 50 }),
    __metadata("design:type", Number)
], ContactQueryDto.prototype, "limit", void 0);
class CreateGroupDto {
    name;
    description;
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'VIP Customers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "description", void 0);
//# sourceMappingURL=contact.dto.js.map