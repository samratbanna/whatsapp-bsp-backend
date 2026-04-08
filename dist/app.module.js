"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const app_config_module_1 = require("./modules/app-config/app-config.module");
const waba_module_1 = require("./modules/waba/waba.module");
const webhook_module_1 = require("./modules/webhook/webhook.module");
const messages_module_1 = require("./modules/messages/messages.module");
const templates_module_1 = require("./modules/templates/templates.module");
const contacts_module_1 = require("./modules/contacts/contacts.module");
const campaigns_module_1 = require("./modules/campaigns/campaigns.module");
const inbox_module_1 = require("./modules/inbox/inbox.module");
const flow_builder_module_1 = require("./modules/flow-builder/flow-builder.module");
const api_keys_module_1 = require("./modules/api-keys/api-keys.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const pricing_module_1 = require("./modules/pricing/pricing.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    uri: config.get('MONGODB_URI'),
                    dbName: 'whatsapp-bsp',
                }),
                inject: [config_1.ConfigService],
            }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    redis: {
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                        password: config.get('REDIS_PASSWORD') || undefined,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            organizations_module_1.OrganizationsModule,
            app_config_module_1.AppConfigModule,
            waba_module_1.WabaModule,
            webhook_module_1.WebhookModule,
            messages_module_1.MessagesModule,
            templates_module_1.TemplatesModule,
            contacts_module_1.ContactsModule,
            campaigns_module_1.CampaignsModule,
            inbox_module_1.InboxModule,
            flow_builder_module_1.FlowBuilderModule,
            api_keys_module_1.ApiKeysModule,
            analytics_module_1.AnalyticsModule,
            wallet_module_1.WalletModule,
            pricing_module_1.PricingModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map