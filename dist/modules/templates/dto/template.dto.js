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
exports.TemplateQueryDto = exports.CreateTemplateDto = exports.TemplateComponentDto = exports.TemplateButtonDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const template_schema_1 = require("../schemas/template.schema");
class TemplateButtonDto {
    type;
    text;
    url;
    phone_number;
}
exports.TemplateButtonDto = TemplateButtonDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateButtonDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateButtonDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateButtonDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateButtonDto.prototype, "phone_number", void 0);
class TemplateComponentDto {
    type;
    format;
    text;
    buttons;
    example;
}
exports.TemplateComponentDto = TemplateComponentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateComponentDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateComponentDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateComponentDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [TemplateButtonDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TemplateButtonDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TemplateComponentDto.prototype, "buttons", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TemplateComponentDto.prototype, "example", void 0);
class CreateTemplateDto {
    name;
    category;
    language;
    components;
    wabaId;
}
exports.CreateTemplateDto = CreateTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order_confirmation' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: template_schema_1.TemplateCategory }),
    (0, class_validator_1.IsEnum)(template_schema_1.TemplateCategory),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'en_US' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TemplateComponentDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TemplateComponentDto),
    __metadata("design:type", Array)
], CreateTemplateDto.prototype, "components", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'WABA ID (uses default if omitted)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTemplateDto.prototype, "wabaId", void 0);
class TemplateQueryDto {
    status;
    category;
    wabaId;
    search;
}
exports.TemplateQueryDto = TemplateQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateQueryDto.prototype, "wabaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateQueryDto.prototype, "search", void 0);
//# sourceMappingURL=template.dto.js.map