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
exports.AppConfigSchema = exports.AppConfig = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AppConfig = class AppConfig {
    key;
    appName;
    appLogo;
    appFavicon;
    primaryColor;
    landingPageEnabled;
    heroTitle;
    heroSubtitle;
    registrationEnabled;
    emailVerificationRequired;
    smtpEnabled;
    smtpHost;
    smtpPort;
    smtpUser;
    smtpPassword;
    smtpFromEmail;
    smtpFromName;
    metaAppId;
    metaAppSecret;
    metaWebhookVerifyToken;
    facebookUrl;
    twitterUrl;
    linkedinUrl;
    footerText;
    supportEmail;
    supportPhone;
    maintenanceMode;
    maintenanceMessage;
};
exports.AppConfig = AppConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, default: 'global' }),
    __metadata("design:type", String)
], AppConfig.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'WhatsApp BSP' }),
    __metadata("design:type", String)
], AppConfig.prototype, "appName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "appLogo", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "appFavicon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '#25D366' }),
    __metadata("design:type", String)
], AppConfig.prototype, "primaryColor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AppConfig.prototype, "landingPageEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "heroTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "heroSubtitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AppConfig.prototype, "registrationEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AppConfig.prototype, "emailVerificationRequired", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AppConfig.prototype, "smtpEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "smtpHost", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], AppConfig.prototype, "smtpPort", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "smtpUser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], AppConfig.prototype, "smtpPassword", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "smtpFromEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "smtpFromName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "metaAppId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], AppConfig.prototype, "metaAppSecret", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "metaWebhookVerifyToken", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "facebookUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "twitterUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "linkedinUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "footerText", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "supportEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "supportPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AppConfig.prototype, "maintenanceMode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AppConfig.prototype, "maintenanceMessage", void 0);
exports.AppConfig = AppConfig = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AppConfig);
exports.AppConfigSchema = mongoose_1.SchemaFactory.createForClass(AppConfig);
//# sourceMappingURL=app-config.schema.js.map