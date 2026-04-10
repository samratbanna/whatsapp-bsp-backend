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
exports.OrganizationSchema = exports.Organization = exports.LoginUserDetails = exports.InvoiceBusinessDetails = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let InvoiceBusinessDetails = class InvoiceBusinessDetails {
    legalBusinessName;
    tradeName;
    gstin;
    pan;
    cin;
    udyamNumber;
    addressLine1;
    addressLine2;
    city;
    state;
    pinCode;
    country;
    contactEmail;
    contactPhone;
    bankAccountName;
    bankAccountNumber;
    bankName;
    ifscCode;
    bankBranch;
};
exports.InvoiceBusinessDetails = InvoiceBusinessDetails;
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "legalBusinessName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "tradeName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, uppercase: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "gstin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, uppercase: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "pan", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, uppercase: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "cin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, uppercase: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "udyamNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "addressLine1", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "addressLine2", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "pinCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: 'India' }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, lowercase: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "contactEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "contactPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "bankAccountName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "bankName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, uppercase: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "ifscCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], InvoiceBusinessDetails.prototype, "bankBranch", void 0);
exports.InvoiceBusinessDetails = InvoiceBusinessDetails = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], InvoiceBusinessDetails);
const InvoiceBusinessDetailsSchema = mongoose_1.SchemaFactory.createForClass(InvoiceBusinessDetails);
let LoginUserDetails = class LoginUserDetails {
    userId;
    name;
    email;
    phone;
    designation;
};
exports.LoginUserDetails = LoginUserDetails;
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], LoginUserDetails.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], LoginUserDetails.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, lowercase: true }),
    __metadata("design:type", String)
], LoginUserDetails.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], LoginUserDetails.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], LoginUserDetails.prototype, "designation", void 0);
exports.LoginUserDetails = LoginUserDetails = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], LoginUserDetails);
const LoginUserDetailsSchema = mongoose_1.SchemaFactory.createForClass(LoginUserDetails);
let Organization = class Organization {
    name;
    slug;
    logo;
    website;
    status;
    trialEndsAt;
    messagesUsedThisMonth;
    usageResetAt;
    wabaIds;
    billingEmail;
    phone;
    address;
    country;
    timezone;
    businessDetails;
    loginUserDetails;
};
exports.Organization = Organization;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "logo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "website", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: enums_1.OrgStatus, default: enums_1.OrgStatus.TRIAL }),
    __metadata("design:type", String)
], Organization.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Organization.prototype, "trialEndsAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Organization.prototype, "messagesUsedThisMonth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], Organization.prototype, "usageResetAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Waba', default: [] }),
    __metadata("design:type", Array)
], Organization.prototype, "wabaIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "billingEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "timezone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: InvoiceBusinessDetailsSchema }),
    __metadata("design:type", InvoiceBusinessDetails)
], Organization.prototype, "businessDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: LoginUserDetailsSchema }),
    __metadata("design:type", LoginUserDetails)
], Organization.prototype, "loginUserDetails", void 0);
exports.Organization = Organization = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Organization);
exports.OrganizationSchema = mongoose_1.SchemaFactory.createForClass(Organization);
exports.OrganizationSchema.index({ slug: 1 }, { unique: true });
//# sourceMappingURL=organization.schema.js.map