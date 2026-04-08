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
exports.WabaSchema = exports.Waba = exports.WabaOwnershipType = exports.WabaStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var WabaStatus;
(function (WabaStatus) {
    WabaStatus["ACTIVE"] = "active";
    WabaStatus["DISCONNECTED"] = "disconnected";
    WabaStatus["PENDING"] = "pending";
    WabaStatus["BANNED"] = "banned";
})(WabaStatus || (exports.WabaStatus = WabaStatus = {}));
var WabaOwnershipType;
(function (WabaOwnershipType) {
    WabaOwnershipType["BYO"] = "byo";
    WabaOwnershipType["SHARED"] = "shared";
})(WabaOwnershipType || (exports.WabaOwnershipType = WabaOwnershipType = {}));
let Waba = class Waba {
    organization;
    ownershipType;
    wabaId;
    phoneNumberId;
    displayPhoneNumber;
    verifiedName;
    accessToken;
    status;
    qualityRating;
    webhookVerifyToken;
    isDefault;
    label;
    poolLabel;
    walletBillingEnabled;
};
exports.Waba = Waba;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Waba.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: WabaOwnershipType, default: WabaOwnershipType.BYO }),
    __metadata("design:type", String)
], Waba.prototype, "ownershipType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "wabaId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "phoneNumberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "displayPhoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "verifiedName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], Waba.prototype, "accessToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: WabaStatus, default: WabaStatus.ACTIVE }),
    __metadata("design:type", String)
], Waba.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "qualityRating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "webhookVerifyToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Waba.prototype, "isDefault", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Waba.prototype, "poolLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Waba.prototype, "walletBillingEnabled", void 0);
exports.Waba = Waba = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Waba);
exports.WabaSchema = mongoose_1.SchemaFactory.createForClass(Waba);
exports.WabaSchema.index({ organization: 1 });
exports.WabaSchema.index({ phoneNumberId: 1 }, { unique: true });
exports.WabaSchema.index({ wabaId: 1 });
//# sourceMappingURL=waba.schema.js.map