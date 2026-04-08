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
exports.WabaService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const waba_schema_1 = require("./schemas/waba.schema");
const meta_api_service_1 = require("../../common/services/meta-api.service");
let WabaService = class WabaService {
    wabaModel;
    metaApi;
    constructor(wabaModel, metaApi) {
        this.wabaModel = wabaModel;
        this.metaApi = metaApi;
    }
    async connect(orgId, dto) {
        const phoneInfo = await this.metaApi.getPhoneNumberInfo(dto.phoneNumberId, dto.accessToken);
        if (dto.isDefault !== false) {
            await this.wabaModel.updateMany({ organization: new mongoose_2.Types.ObjectId(orgId) }, { isDefault: false });
        }
        const walletBillingEnabled = dto.walletBillingEnabled !== undefined
            ? dto.walletBillingEnabled
            : dto.ownershipType === waba_schema_1.WabaOwnershipType.SHARED;
        const waba = new this.wabaModel({
            organization: new mongoose_2.Types.ObjectId(orgId),
            ownershipType: dto.ownershipType || waba_schema_1.WabaOwnershipType.BYO,
            wabaId: dto.wabaId,
            phoneNumberId: dto.phoneNumberId,
            accessToken: dto.accessToken,
            displayPhoneNumber: phoneInfo.display_phone_number,
            verifiedName: phoneInfo.verified_name,
            qualityRating: phoneInfo.quality_rating,
            label: dto.label,
            poolLabel: dto.poolLabel,
            isDefault: dto.isDefault !== false,
            walletBillingEnabled,
            status: waba_schema_1.WabaStatus.ACTIVE,
        });
        return waba.save();
    }
    async assignShared(dto) {
        const phoneInfo = await this.metaApi.getPhoneNumberInfo(dto.phoneNumberId, dto.accessToken);
        await this.wabaModel.updateMany({ organization: new mongoose_2.Types.ObjectId(dto.orgId) }, { isDefault: false });
        const waba = new this.wabaModel({
            organization: new mongoose_2.Types.ObjectId(dto.orgId),
            ownershipType: waba_schema_1.WabaOwnershipType.SHARED,
            wabaId: dto.wabaId,
            phoneNumberId: dto.phoneNumberId,
            accessToken: dto.accessToken,
            displayPhoneNumber: phoneInfo.display_phone_number,
            verifiedName: phoneInfo.verified_name,
            qualityRating: phoneInfo.quality_rating,
            label: dto.label || 'Shared BSP Number',
            poolLabel: dto.poolLabel,
            isDefault: true,
            walletBillingEnabled: true,
            status: waba_schema_1.WabaStatus.ACTIVE,
        });
        return waba.save();
    }
    async findByOrg(orgId) {
        return this.wabaModel
            .find({ organization: new mongoose_2.Types.ObjectId(orgId) })
            .select('-accessToken')
            .exec();
    }
    async findOne(id, orgId) {
        const filter = { _id: id };
        if (orgId)
            filter.organization = new mongoose_2.Types.ObjectId(orgId);
        const waba = await this.wabaModel.findOne(filter).select('+accessToken').exec();
        if (!waba)
            throw new common_1.NotFoundException('WABA not found');
        return waba;
    }
    async findDefaultForOrg(orgId) {
        return this.wabaModel
            .findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
            isDefault: true,
            status: waba_schema_1.WabaStatus.ACTIVE,
        })
            .select('+accessToken')
            .exec();
    }
    async findByPhoneNumberId(phoneNumberId) {
        return this.wabaModel
            .findOne({ phoneNumberId })
            .select('+accessToken')
            .exec();
    }
    async update(id, orgId, dto) {
        const waba = await this.wabaModel.findOne({
            _id: id,
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
        if (!waba)
            throw new common_1.NotFoundException('WABA not found');
        if (dto.isDefault) {
            await this.wabaModel.updateMany({ organization: new mongoose_2.Types.ObjectId(orgId), _id: { $ne: id } }, { isDefault: false });
        }
        Object.assign(waba, dto);
        return waba.save();
    }
    async disconnect(id, orgId) {
        const waba = await this.wabaModel.findOne({
            _id: id,
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
        if (!waba)
            throw new common_1.NotFoundException('WABA not found');
        waba.status = waba_schema_1.WabaStatus.DISCONNECTED;
        return waba.save();
    }
    async remove(id, orgId) {
        const result = await this.wabaModel.deleteOne({
            _id: id,
            organization: new mongoose_2.Types.ObjectId(orgId),
        });
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('WABA not found');
    }
};
exports.WabaService = WabaService;
exports.WabaService = WabaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(waba_schema_1.Waba.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        meta_api_service_1.MetaApiService])
], WabaService);
//# sourceMappingURL=waba.service.js.map