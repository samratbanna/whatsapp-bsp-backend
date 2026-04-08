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
exports.ApiKeysService = exports.CreateApiKeyDto = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const api_key_schema_1 = require("./schemas/api-key.schema");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateApiKeyDto {
    name;
    scopes;
    expiresAt;
}
exports.CreateApiKeyDto = CreateApiKeyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Production Key' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        example: ['messages:send', 'contacts:read'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateApiKeyDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "expiresAt", void 0);
let ApiKeysService = class ApiKeysService {
    apiKeyModel;
    constructor(apiKeyModel) {
        this.apiKeyModel = apiKeyModel;
    }
    generateKey() {
        return `bsp_live_${(0, crypto_1.randomBytes)(24).toString('hex')}`;
    }
    async create(orgId, userId, dto) {
        const key = this.generateKey();
        const doc = await this.apiKeyModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            createdBy: new mongoose_2.Types.ObjectId(userId),
            name: dto.name,
            key,
            keyPrefix: key.substring(0, 16),
            scopes: dto.scopes || ['messages:send', 'contacts:read', 'templates:read'],
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        });
        return { ...doc.toObject(), key };
    }
    async findAll(orgId) {
        return this.apiKeyModel
            .find({ organization: new mongoose_2.Types.ObjectId(orgId) })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async revoke(id, orgId) {
        const key = await this.apiKeyModel.findOneAndUpdate({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) }, { isActive: false }, { new: true });
        if (!key)
            throw new common_1.NotFoundException('API key not found');
        return key;
    }
    async remove(id, orgId) {
        const result = await this.apiKeyModel.deleteOne({
            _id: id,
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('API key not found');
    }
    async validateKey(rawKey) {
        const doc = await this.apiKeyModel
            .findOne({ key: rawKey, isActive: true })
            .select('+key')
            .populate('organization')
            .exec();
        if (!doc)
            return null;
        if (doc.expiresAt && doc.expiresAt < new Date())
            return null;
        await this.apiKeyModel.findByIdAndUpdate(doc._id, { lastUsedAt: new Date() });
        return doc;
    }
};
exports.ApiKeysService = ApiKeysService;
exports.ApiKeysService = ApiKeysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(api_key_schema_1.ApiKey.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ApiKeysService);
//# sourceMappingURL=api-keys.service.js.map