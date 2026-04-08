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
exports.PlanSchema = exports.Plan = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const enums_1 = require("../../../common/enums");
let Plan = class Plan {
    name;
    type;
    price;
    status;
    isDefault;
    monthlyMessageLimit;
    agentLimit;
    wabaLimit;
    templateLimit;
    broadcastLimit;
    flowBuilderAccess;
    apiAccess;
    webhookAccess;
    aiChatbotAccess;
    trialDays;
    description;
    features;
};
exports.Plan = Plan;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Plan.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: enums_1.PlanType, default: enums_1.PlanType.FREE }),
    __metadata("design:type", String)
], Plan.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Plan.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: enums_1.PlanStatus, default: enums_1.PlanStatus.ACTIVE }),
    __metadata("design:type", String)
], Plan.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Plan.prototype, "isDefault", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1000 }),
    __metadata("design:type", Number)
], Plan.prototype, "monthlyMessageLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Plan.prototype, "agentLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Plan.prototype, "wabaLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 3 }),
    __metadata("design:type", Number)
], Plan.prototype, "templateLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Plan.prototype, "broadcastLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Plan.prototype, "flowBuilderAccess", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Plan.prototype, "apiAccess", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Plan.prototype, "webhookAccess", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Plan.prototype, "aiChatbotAccess", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 30 }),
    __metadata("design:type", Number)
], Plan.prototype, "trialDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Plan.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Plan.prototype, "features", void 0);
exports.Plan = Plan = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Plan);
exports.PlanSchema = mongoose_1.SchemaFactory.createForClass(Plan);
//# sourceMappingURL=plan.schema.js.map