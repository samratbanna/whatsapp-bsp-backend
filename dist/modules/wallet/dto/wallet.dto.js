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
exports.WalletTxQueryDto = exports.UpdateWalletSettingsDto = exports.BulkAddCreditsDto = exports.AddCreditsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const wallet_schema_1 = require("../schemas/wallet.schema");
class AddCreditsDto {
    category;
    credits;
    reason;
    description;
}
exports.AddCreditsDto = AddCreditsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: wallet_schema_1.WalletCategory, example: 'transactional' }),
    (0, class_validator_1.IsEnum)(wallet_schema_1.WalletCategory),
    __metadata("design:type", String)
], AddCreditsDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1000, description: 'Number of message credits to add' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddCreditsDto.prototype, "credits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: wallet_schema_1.TransactionReason, example: 'admin_topup' }),
    (0, class_validator_1.IsEnum)(wallet_schema_1.TransactionReason),
    __metadata("design:type", String)
], AddCreditsDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Client paid ₹500 cash — adding 1000 transactional' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddCreditsDto.prototype, "description", void 0);
class BulkAddCreditsDto {
    transactional;
    promotional;
    authentication;
    description;
}
exports.BulkAddCreditsDto = BulkAddCreditsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1000 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], BulkAddCreditsDto.prototype, "transactional", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1000 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], BulkAddCreditsDto.prototype, "promotional", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], BulkAddCreditsDto.prototype, "authentication", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Monthly recharge — cash received' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkAddCreditsDto.prototype, "description", void 0);
class UpdateWalletSettingsDto {
    lowTransactionalThreshold;
    lowPromotionalThreshold;
    lowAuthenticationThreshold;
    blockOnEmpty;
}
exports.UpdateWalletSettingsDto = UpdateWalletSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateWalletSettingsDto.prototype, "lowTransactionalThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateWalletSettingsDto.prototype, "lowPromotionalThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateWalletSettingsDto.prototype, "lowAuthenticationThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateWalletSettingsDto.prototype, "blockOnEmpty", void 0);
class WalletTxQueryDto {
    category;
    reason;
    from;
    to;
    page;
    limit;
}
exports.WalletTxQueryDto = WalletTxQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: wallet_schema_1.WalletCategory }),
    (0, class_validator_1.IsEnum)(wallet_schema_1.WalletCategory),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WalletTxQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: wallet_schema_1.TransactionReason }),
    (0, class_validator_1.IsEnum)(wallet_schema_1.TransactionReason),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WalletTxQueryDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WalletTxQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WalletTxQueryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    __metadata("design:type", Number)
], WalletTxQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 50 }),
    __metadata("design:type", Number)
], WalletTxQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=wallet.dto.js.map