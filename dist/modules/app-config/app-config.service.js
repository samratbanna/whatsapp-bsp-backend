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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const app_config_schema_1 = require("./schemas/app-config.schema");
let AppConfigService = class AppConfigService {
    configModel;
    constructor(configModel) {
        this.configModel = configModel;
    }
    async onModuleInit() {
        const existing = await this.configModel.findOne({ key: 'global' });
        if (!existing) {
            await this.configModel.create({ key: 'global' });
            console.log('✅ App config initialized');
        }
    }
    async get(includeSecrets = false) {
        const query = this.configModel.findOne({ key: 'global' });
        if (includeSecrets)
            query.select('+smtpPassword +metaAppSecret');
        const result = await query.exec();
        return result;
    }
    async update(data) {
        return this.configModel.findOneAndUpdate({ key: 'global' }, { $set: data }, { new: true, upsert: true });
    }
    async getPublic() {
        const config = await this.get();
        return {
            appName: config.appName,
            appLogo: config.appLogo,
            appFavicon: config.appFavicon,
            primaryColor: config.primaryColor,
            landingPageEnabled: config.landingPageEnabled,
            heroTitle: config.heroTitle,
            heroSubtitle: config.heroSubtitle,
            registrationEnabled: config.registrationEnabled,
            facebookUrl: config.facebookUrl,
            twitterUrl: config.twitterUrl,
            linkedinUrl: config.linkedinUrl,
            footerText: config.footerText,
            supportEmail: config.supportEmail,
            supportPhone: config.supportPhone,
            maintenanceMode: config.maintenanceMode,
            maintenanceMessage: config.maintenanceMessage,
        };
    }
};
exports.AppConfigService = AppConfigService;
exports.AppConfigService = AppConfigService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(app_config_schema_1.AppConfig.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AppConfigService);
//# sourceMappingURL=app-config.service.js.map