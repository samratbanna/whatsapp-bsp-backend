"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const mongoose_1 = require("@nestjs/mongoose");
const campaign_schema_1 = require("./schemas/campaign.schema");
const campaigns_service_1 = require("./campaigns.service");
const campaigns_controller_1 = require("./campaigns.controller");
const campaign_processor_1 = require("./processors/campaign.processor");
const waba_module_1 = require("../waba/waba.module");
const messages_module_1 = require("../messages/messages.module");
const contacts_module_1 = require("../contacts/contacts.module");
const wallet_module_1 = require("../wallet/wallet.module");
let CampaignsModule = class CampaignsModule {
};
exports.CampaignsModule = CampaignsModule;
exports.CampaignsModule = CampaignsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: campaign_schema_1.Campaign.name, schema: campaign_schema_1.CampaignSchema }]),
            bull_1.BullModule.registerQueue({ name: campaign_processor_1.CAMPAIGN_QUEUE }),
            waba_module_1.WabaModule,
            messages_module_1.MessagesModule,
            contacts_module_1.ContactsModule,
            wallet_module_1.WalletModule,
        ],
        controllers: [campaigns_controller_1.CampaignsController],
        providers: [campaigns_service_1.CampaignsService, campaign_processor_1.CampaignProcessor],
        exports: [campaigns_service_1.CampaignsService],
    })
], CampaignsModule);
//# sourceMappingURL=campaigns.module.js.map