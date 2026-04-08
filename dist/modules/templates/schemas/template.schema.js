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
exports.TemplateSchema = exports.Template = exports.TemplateStatus = exports.TemplateCategory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var TemplateCategory;
(function (TemplateCategory) {
    TemplateCategory["MARKETING"] = "MARKETING";
    TemplateCategory["UTILITY"] = "UTILITY";
    TemplateCategory["AUTHENTICATION"] = "AUTHENTICATION";
})(TemplateCategory || (exports.TemplateCategory = TemplateCategory = {}));
var TemplateStatus;
(function (TemplateStatus) {
    TemplateStatus["APPROVED"] = "APPROVED";
    TemplateStatus["PENDING"] = "PENDING";
    TemplateStatus["REJECTED"] = "REJECTED";
    TemplateStatus["PAUSED"] = "PAUSED";
    TemplateStatus["DISABLED"] = "DISABLED";
})(TemplateStatus || (exports.TemplateStatus = TemplateStatus = {}));
let Template = class Template {
    organization;
    waba;
    metaTemplateId;
    name;
    category;
    language;
    status;
    rejectedReason;
    components;
    variables;
    lastSyncedAt;
};
exports.Template = Template;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Template.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Waba', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Template.prototype, "waba", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Template.prototype, "metaTemplateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Template.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: TemplateCategory, required: true }),
    __metadata("design:type", String)
], Template.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Template.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: TemplateStatus, default: TemplateStatus.PENDING }),
    __metadata("design:type", String)
], Template.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Template.prototype, "rejectedReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Template.prototype, "components", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Template.prototype, "variables", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Template.prototype, "lastSyncedAt", void 0);
exports.Template = Template = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Template);
exports.TemplateSchema = mongoose_1.SchemaFactory.createForClass(Template);
exports.TemplateSchema.index({ organization: 1, waba: 1, name: 1 }, { unique: true });
exports.TemplateSchema.index({ status: 1 });
//# sourceMappingURL=template.schema.js.map