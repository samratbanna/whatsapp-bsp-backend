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
exports.AssignSharedWabaDto = exports.UpdateWabaDto = exports.ConnectWabaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const waba_schema_1 = require("../schemas/waba.schema");
class ConnectWabaDto {
    wabaId;
    phoneNumberId;
    accessToken;
    ownershipType;
    label;
    poolLabel;
    isDefault;
    walletBillingEnabled;
}
exports.ConnectWabaDto = ConnectWabaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'WhatsApp Business Account ID from Meta' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWabaDto.prototype, "wabaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone Number ID from Meta dashboard' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWabaDto.prototype, "phoneNumberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Permanent system user access token' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectWabaDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: waba_schema_1.WabaOwnershipType, default: waba_schema_1.WabaOwnershipType.BYO }),
    (0, class_validator_1.IsEnum)(waba_schema_1.WabaOwnershipType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConnectWabaDto.prototype, "ownershipType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Friendly label e.g. Support Number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConnectWabaDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConnectWabaDto.prototype, "poolLabel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ConnectWabaDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Deduct wallet for messages (auto-true for SHARED, false for BYO)' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ConnectWabaDto.prototype, "walletBillingEnabled", void 0);
class UpdateWabaDto {
    accessToken;
    label;
    isDefault;
    walletBillingEnabled;
}
exports.UpdateWabaDto = UpdateWabaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWabaDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWabaDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateWabaDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateWabaDto.prototype, "walletBillingEnabled", void 0);
class AssignSharedWabaDto {
    orgId;
    wabaId;
    phoneNumberId;
    accessToken;
    label;
    poolLabel;
}
exports.AssignSharedWabaDto = AssignSharedWabaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organization ID to assign this WABA to' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignSharedWabaDto.prototype, "orgId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'WABA ID from BSP Meta account' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignSharedWabaDto.prototype, "wabaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone Number ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignSharedWabaDto.prototype, "phoneNumberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'BSP system user access token' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignSharedWabaDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssignSharedWabaDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssignSharedWabaDto.prototype, "poolLabel", void 0);
//# sourceMappingURL=waba.dto.js.map