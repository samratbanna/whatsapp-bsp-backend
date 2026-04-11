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
exports.CampaignQueryDto = exports.UpdateCampaignDto = exports.CreateCampaignDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const campaign_schema_1 = require("../schemas/campaign.schema");
class CreateCampaignDto {
    name;
    type;
    templateId;
    templateLanguage;
    templateVariables;
    contacts;
    groups;
    scheduledAt;
    messagesPerSecond;
    wabaId;
}
exports.CreateCampaignDto = CreateCampaignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Diwali Offers 2024' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: campaign_schema_1.CampaignType }),
    (0, class_validator_1.IsEnum)(campaign_schema_1.CampaignType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Template ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'en_US', default: 'en_US' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "templateLanguage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Object,
        example: { '1': 'Customer', '2': '20% OFF' },
        description: 'Static values. Use {{contact.name}} or {{contact.phone}} for dynamic.',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateCampaignDto.prototype, "templateVariables", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Contact IDs' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCampaignDto.prototype, "contacts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Contact Group IDs' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCampaignDto.prototype, "groups", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO date string for scheduled campaigns' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10, minimum: 1, maximum: 80 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(80),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCampaignDto.prototype, "messagesPerSecond", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'WABA ID (uses default if omitted)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "wabaId", void 0);
class UpdateCampaignDto extends (0, swagger_1.PartialType)(CreateCampaignDto) {
}
exports.UpdateCampaignDto = UpdateCampaignDto;
class CampaignQueryDto {
    status;
    page;
    limit;
}
exports.CampaignQueryDto = CampaignQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    __metadata("design:type", Number)
], CampaignQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    __metadata("design:type", Number)
], CampaignQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=campaign.dto.js.map