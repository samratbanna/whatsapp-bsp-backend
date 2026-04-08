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
exports.WalletTransactionSchema = exports.WalletTransaction = exports.TransactionReason = exports.TransactionType = exports.WalletCategory = exports.WalletSchema = exports.Wallet = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Wallet = class Wallet {
    organization;
    transactional;
    promotional;
    authentication;
    totalTransactionalAdded;
    totalPromotionalAdded;
    totalAuthenticationAdded;
    totalTransactionalUsed;
    totalPromotionalUsed;
    totalAuthenticationUsed;
    lowTransactionalThreshold;
    lowPromotionalThreshold;
    lowAuthenticationThreshold;
    lowTransactionalAlertSent;
    lowPromotionalAlertSent;
    lowAuthenticationAlertSent;
    blockOnEmpty;
};
exports.Wallet = Wallet;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Wallet.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "transactional", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "promotional", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "authentication", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalTransactionalAdded", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalPromotionalAdded", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalAuthenticationAdded", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalTransactionalUsed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalPromotionalUsed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "totalAuthenticationUsed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 100 }),
    __metadata("design:type", Number)
], Wallet.prototype, "lowTransactionalThreshold", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 100 }),
    __metadata("design:type", Number)
], Wallet.prototype, "lowPromotionalThreshold", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 20 }),
    __metadata("design:type", Number)
], Wallet.prototype, "lowAuthenticationThreshold", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "lowTransactionalAlertSent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "lowPromotionalAlertSent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "lowAuthenticationAlertSent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Wallet.prototype, "blockOnEmpty", void 0);
exports.Wallet = Wallet = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Wallet);
exports.WalletSchema = mongoose_1.SchemaFactory.createForClass(Wallet);
exports.WalletSchema.index({ organization: 1 }, { unique: true });
var WalletCategory;
(function (WalletCategory) {
    WalletCategory["TRANSACTIONAL"] = "transactional";
    WalletCategory["PROMOTIONAL"] = "promotional";
    WalletCategory["AUTHENTICATION"] = "authentication";
})(WalletCategory || (exports.WalletCategory = WalletCategory = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "credit";
    TransactionType["DEBIT"] = "debit";
    TransactionType["REFUND"] = "refund";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionReason;
(function (TransactionReason) {
    TransactionReason["ADMIN_TOPUP"] = "admin_topup";
    TransactionReason["MESSAGE_USE"] = "message_use";
    TransactionReason["REFUND"] = "refund";
    TransactionReason["ADJUSTMENT"] = "adjustment";
    TransactionReason["BONUS"] = "bonus";
    TransactionReason["EXPIRY"] = "expiry";
})(TransactionReason || (exports.TransactionReason = TransactionReason = {}));
let WalletTransaction = class WalletTransaction {
    organization;
    wallet;
    type;
    reason;
    category;
    credits;
    creditsBefore;
    creditsAfter;
    message;
    campaign;
    metaMessageId;
    description;
    performedBy;
};
exports.WalletTransaction = WalletTransaction;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WalletTransaction.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Wallet', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WalletTransaction.prototype, "wallet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: TransactionType, required: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: TransactionReason, required: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: WalletCategory, required: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "credits", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "creditsBefore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "creditsAfter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Message' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WalletTransaction.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Campaign' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WalletTransaction.prototype, "campaign", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "metaMessageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "performedBy", void 0);
exports.WalletTransaction = WalletTransaction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WalletTransaction);
exports.WalletTransactionSchema = mongoose_1.SchemaFactory.createForClass(WalletTransaction);
exports.WalletTransactionSchema.index({ organization: 1, createdAt: -1 });
exports.WalletTransactionSchema.index({ organization: 1, category: 1 });
exports.WalletTransactionSchema.index({ metaMessageId: 1 });
//# sourceMappingURL=wallet.schema.js.map