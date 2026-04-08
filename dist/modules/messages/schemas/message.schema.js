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
exports.MessageSchema = exports.Message = exports.MessageType = exports.MessageStatus = exports.MessageDirection = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var MessageDirection;
(function (MessageDirection) {
    MessageDirection["INBOUND"] = "inbound";
    MessageDirection["OUTBOUND"] = "outbound";
})(MessageDirection || (exports.MessageDirection = MessageDirection = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["QUEUED"] = "queued";
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["VIDEO"] = "video";
    MessageType["AUDIO"] = "audio";
    MessageType["DOCUMENT"] = "document";
    MessageType["TEMPLATE"] = "template";
    MessageType["INTERACTIVE"] = "interactive";
    MessageType["LOCATION"] = "location";
    MessageType["STICKER"] = "sticker";
    MessageType["REACTION"] = "reaction";
    MessageType["CONTACTS"] = "contacts";
})(MessageType || (exports.MessageType = MessageType = {}));
let Message = class Message {
    organization;
    waba;
    metaMessageId;
    metaConversationId;
    from;
    to;
    direction;
    type;
    status;
    content;
    contact;
    sentAt;
    deliveredAt;
    readAt;
    failedAt;
    failureReason;
    conversationWindowExpiry;
    campaign;
};
exports.Message = Message;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Waba', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "waba", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, index: true }),
    __metadata("design:type", String)
], Message.prototype, "metaMessageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Message.prototype, "metaConversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Message.prototype, "from", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Message.prototype, "to", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: MessageDirection, required: true }),
    __metadata("design:type", String)
], Message.prototype, "direction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: MessageType, default: MessageType.TEXT }),
    __metadata("design:type", String)
], Message.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: MessageStatus, default: MessageStatus.QUEUED }),
    __metadata("design:type", String)
], Message.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Message.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Contact', default: null }),
    __metadata("design:type", Object)
], Message.prototype, "contact", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Message.prototype, "sentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Message.prototype, "deliveredAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Message.prototype, "readAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Message.prototype, "failedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Message.prototype, "failureReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Message.prototype, "conversationWindowExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Campaign', default: null }),
    __metadata("design:type", Object)
], Message.prototype, "campaign", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
exports.MessageSchema.index({ organization: 1, from: 1, createdAt: -1 });
exports.MessageSchema.index({ metaMessageId: 1 });
exports.MessageSchema.index({ organization: 1, createdAt: -1 });
//# sourceMappingURL=message.schema.js.map