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
exports.ContactGroupSchema = exports.ContactGroup = exports.ContactSchema = exports.Contact = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Contact = class Contact {
    organization;
    phone;
    name;
    email;
    avatar;
    groups;
    customFields;
    isWhatsAppUser;
    lastMessageAt;
    optedOut;
    optedOutAt;
    notes;
    labels;
};
exports.Contact = Contact;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Contact.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Contact.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Contact.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Contact.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Contact.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'ContactGroup' }], default: [] }),
    __metadata("design:type", Array)
], Contact.prototype, "groups", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Contact.prototype, "customFields", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Contact.prototype, "isWhatsAppUser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Contact.prototype, "lastMessageAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Contact.prototype, "optedOut", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Contact.prototype, "optedOutAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Contact.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Contact.prototype, "labels", void 0);
exports.Contact = Contact = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Contact);
exports.ContactSchema = mongoose_1.SchemaFactory.createForClass(Contact);
exports.ContactSchema.index({ organization: 1, phone: 1 }, { unique: true });
exports.ContactSchema.index({ organization: 1, name: 'text', phone: 'text' });
let ContactGroup = class ContactGroup {
    organization;
    name;
    description;
    contactCount;
};
exports.ContactGroup = ContactGroup;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ContactGroup.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ContactGroup.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ContactGroup.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ContactGroup.prototype, "contactCount", void 0);
exports.ContactGroup = ContactGroup = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ContactGroup);
exports.ContactGroupSchema = mongoose_1.SchemaFactory.createForClass(ContactGroup);
exports.ContactGroupSchema.index({ organization: 1, name: 1 }, { unique: true });
//# sourceMappingURL=contact.schema.js.map