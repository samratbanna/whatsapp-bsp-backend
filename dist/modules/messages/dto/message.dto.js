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
exports.MessageQueryDto = exports.SendMediaDto = exports.SendTemplateDto = exports.TemplateComponent = exports.TemplateComponentParameter = exports.SendTextDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const message_schema_1 = require("../schemas/message.schema");
class SendTextDto {
    to;
    text;
    wabaId;
}
exports.SendTextDto = SendTextDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '919876543210' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendTextDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hello from BSP!' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendTextDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'WABA ID to use (uses default if omitted)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendTextDto.prototype, "wabaId", void 0);
class TemplateComponentParameter {
    type;
    text;
    image;
    document;
}
exports.TemplateComponentParameter = TemplateComponentParameter;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['text', 'image', 'video', 'document', 'payload'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateComponentParameter.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateComponentParameter.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TemplateComponentParameter.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TemplateComponentParameter.prototype, "document", void 0);
class TemplateComponent {
    type;
    sub_type;
    index;
    parameters;
}
exports.TemplateComponent = TemplateComponent;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['header', 'body', 'button'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateComponent.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateComponent.prototype, "sub_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TemplateComponent.prototype, "index", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [TemplateComponentParameter] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TemplateComponentParameter),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TemplateComponent.prototype, "parameters", void 0);
class SendTemplateDto {
    to;
    templateName;
    languageCode;
    category;
    components;
    wabaId;
}
exports.SendTemplateDto = SendTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '919876543210' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendTemplateDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order_confirmation' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendTemplateDto.prototype, "templateName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'en_US' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendTemplateDto.prototype, "languageCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'MARKETING',
        description: 'Template category — used for wallet billing',
        enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendTemplateDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [TemplateComponent] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TemplateComponent),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SendTemplateDto.prototype, "components", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendTemplateDto.prototype, "wabaId", void 0);
class SendMediaDto {
    to;
    type;
    mediaUrl;
    caption;
    filename;
    wabaId;
}
exports.SendMediaDto = SendMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '919876543210' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMediaDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: [message_schema_1.MessageType.IMAGE, message_schema_1.MessageType.VIDEO, message_schema_1.MessageType.AUDIO, message_schema_1.MessageType.DOCUMENT] }),
    (0, class_validator_1.IsEnum)(message_schema_1.MessageType),
    __metadata("design:type", String)
], SendMediaDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://example.com/file.pdf' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMediaDto.prototype, "mediaUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMediaDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMediaDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMediaDto.prototype, "wabaId", void 0);
class MessageQueryDto {
    phone;
    wabaId;
    page;
    limit;
}
exports.MessageQueryDto = MessageQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MessageQueryDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MessageQueryDto.prototype, "wabaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MessageQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 50 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MessageQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=message.dto.js.map