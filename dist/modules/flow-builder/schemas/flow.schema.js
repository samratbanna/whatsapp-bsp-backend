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
exports.FlowSessionSchema = exports.FlowSession = exports.FlowSchema = exports.Flow = exports.NodeType = exports.FlowStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var FlowStatus;
(function (FlowStatus) {
    FlowStatus["ACTIVE"] = "active";
    FlowStatus["INACTIVE"] = "inactive";
    FlowStatus["DRAFT"] = "draft";
})(FlowStatus || (exports.FlowStatus = FlowStatus = {}));
var NodeType;
(function (NodeType) {
    NodeType["TRIGGER"] = "trigger";
    NodeType["SEND_TEXT"] = "send_text";
    NodeType["SEND_TEMPLATE"] = "send_template";
    NodeType["SEND_MEDIA"] = "send_media";
    NodeType["CONDITION"] = "condition";
    NodeType["SET_VARIABLE"] = "set_variable";
    NodeType["API_REQUEST"] = "api_request";
    NodeType["DELAY"] = "delay";
    NodeType["JUMP"] = "jump";
    NodeType["END"] = "end";
    NodeType["ASSIGN_AGENT"] = "assign_agent";
    NodeType["ADD_LABEL"] = "add_label";
    NodeType["RESET_FLOW"] = "reset_flow";
})(NodeType || (exports.NodeType = NodeType = {}));
let Flow = class Flow {
    organization;
    waba;
    name;
    description;
    status;
    trigger;
    nodes;
    triggerCount;
    completionCount;
    priority;
};
exports.Flow = Flow;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Flow.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Waba', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Flow.prototype, "waba", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Flow.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Flow.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: FlowStatus, default: FlowStatus.DRAFT }),
    __metadata("design:type", String)
], Flow.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Object,
        default: { type: 'keyword', keywords: [] },
    }),
    __metadata("design:type", Object)
], Flow.prototype, "trigger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Flow.prototype, "nodes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Flow.prototype, "triggerCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Flow.prototype, "completionCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Flow.prototype, "priority", void 0);
exports.Flow = Flow = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Flow);
exports.FlowSchema = mongoose_1.SchemaFactory.createForClass(Flow);
exports.FlowSchema.index({ organization: 1, status: 1 });
let FlowSession = class FlowSession {
    organization;
    phone;
    flow;
    currentNodeId;
    variables;
    isActive;
    expiresAt;
};
exports.FlowSession = FlowSession;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], FlowSession.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FlowSession.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Flow', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], FlowSession.prototype, "flow", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FlowSession.prototype, "currentNodeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], FlowSession.prototype, "variables", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], FlowSession.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], FlowSession.prototype, "expiresAt", void 0);
exports.FlowSession = FlowSession = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, expireAfterSeconds: 86400 })
], FlowSession);
exports.FlowSessionSchema = mongoose_1.SchemaFactory.createForClass(FlowSession);
exports.FlowSessionSchema.index({ organization: 1, phone: 1 });
exports.FlowSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=flow.schema.js.map