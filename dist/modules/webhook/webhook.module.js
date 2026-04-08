"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookModule = void 0;
const common_1 = require("@nestjs/common");
const webhook_controller_1 = require("./webhook.controller");
const webhook_service_1 = require("./webhook.service");
const messages_module_1 = require("../messages/messages.module");
const waba_module_1 = require("../waba/waba.module");
const flow_builder_module_1 = require("../flow-builder/flow-builder.module");
const inbox_module_1 = require("../inbox/inbox.module");
let WebhookModule = class WebhookModule {
};
exports.WebhookModule = WebhookModule;
exports.WebhookModule = WebhookModule = __decorate([
    (0, common_1.Module)({
        imports: [messages_module_1.MessagesModule, waba_module_1.WabaModule, flow_builder_module_1.FlowBuilderModule, inbox_module_1.InboxModule],
        controllers: [webhook_controller_1.WebhookController],
        providers: [webhook_service_1.WebhookService],
    })
], WebhookModule);
//# sourceMappingURL=webhook.module.js.map