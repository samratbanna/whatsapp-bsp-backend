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
exports.CampaignSchema = exports.Campaign = exports.CampaignType = exports.CampaignStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "draft";
    CampaignStatus["SCHEDULED"] = "scheduled";
    CampaignStatus["RUNNING"] = "running";
    CampaignStatus["COMPLETED"] = "completed";
    CampaignStatus["PAUSED"] = "paused";
    CampaignStatus["FAILED"] = "failed";
    CampaignStatus["CANCELLED"] = "cancelled";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
var CampaignType;
(function (CampaignType) {
    CampaignType["BROADCAST"] = "broadcast";
    CampaignType["SCHEDULED"] = "scheduled";
})(CampaignType || (exports.CampaignType = CampaignType = {}));
let Campaign = class Campaign {
    organization;
    waba;
    name;
    type;
    status;
    template;
    templateLanguage;
    templateVariables;
    contacts;
    groups;
    scheduledAt;
    totalCount;
    sentCount;
    deliveredCount;
    readCount;
    failedCount;
    messagesPerSecond;
    jobId;
    startedAt;
    completedAt;
    failureReason;
};
exports.Campaign = Campaign;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Campaign.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Waba', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Campaign.prototype, "waba", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Campaign.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: CampaignType, default: CampaignType.BROADCAST }),
    __metadata("design:type", String)
], Campaign.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: CampaignStatus, default: CampaignStatus.DRAFT }),
    __metadata("design:type", String)
], Campaign.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Template', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Campaign.prototype, "template", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Campaign.prototype, "templateLanguage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Campaign.prototype, "templateVariables", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Contact' }], default: [] }),
    __metadata("design:type", Array)
], Campaign.prototype, "contacts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'ContactGroup' }], default: [] }),
    __metadata("design:type", Array)
], Campaign.prototype, "groups", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Campaign.prototype, "scheduledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "totalCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "sentCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "deliveredCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "readCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Campaign.prototype, "failedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 10 }),
    __metadata("design:type", Number)
], Campaign.prototype, "messagesPerSecond", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Campaign.prototype, "jobId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Campaign.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Campaign.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Campaign.prototype, "failureReason", void 0);
exports.Campaign = Campaign = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Campaign);
exports.CampaignSchema = mongoose_1.SchemaFactory.createForClass(Campaign);
exports.CampaignSchema.index({ organization: 1, status: 1 });
exports.CampaignSchema.index({ scheduledAt: 1, status: 1 });
//# sourceMappingURL=campaign.schema.js.map