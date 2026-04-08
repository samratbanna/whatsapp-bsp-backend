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
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const messages_service_1 = require("../messages/messages.service");
const waba_service_1 = require("../waba/waba.service");
const meta_api_service_1 = require("../../common/services/meta-api.service");
const flow_executor_1 = require("../flow-builder/executors/flow.executor");
const inbox_gateway_1 = require("../inbox/gateways/inbox.gateway");
let WebhookService = WebhookService_1 = class WebhookService {
    config;
    messagesService;
    wabaService;
    metaApi;
    flowExecutor;
    inboxGateway;
    logger = new common_1.Logger(WebhookService_1.name);
    constructor(config, messagesService, wabaService, metaApi, flowExecutor, inboxGateway) {
        this.config = config;
        this.messagesService = messagesService;
        this.wabaService = wabaService;
        this.metaApi = metaApi;
        this.flowExecutor = flowExecutor;
        this.inboxGateway = inboxGateway;
    }
    verifyToken(token) {
        const expected = this.config.get('META_WEBHOOK_VERIFY_TOKEN');
        return token === expected;
    }
    async processEvent(body, signature, rawBody) {
        if (signature && rawBody) {
            const appSecret = this.config.get('META_APP_SECRET');
            if (appSecret) {
                const valid = this.metaApi.verifySignature(rawBody.toString(), signature, appSecret);
                if (!valid) {
                    this.logger.warn('Invalid webhook signature — ignoring event');
                    return;
                }
            }
        }
        if (body.object !== 'whatsapp_business_account')
            return;
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field !== 'messages')
                    continue;
                await this.processChange(change.value);
            }
        }
    }
    async processChange(value) {
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (!phoneNumberId)
            return;
        const waba = await this.wabaService.findByPhoneNumberId(phoneNumberId);
        if (!waba) {
            this.logger.warn(`No WABA found for phoneNumberId: ${phoneNumberId}`);
            return;
        }
        const orgId = waba.organization.toString();
        const wabaDbId = waba._id.toString();
        for (const message of value.messages || []) {
            try {
                const stored = await this.messagesService.storeInbound(orgId, wabaDbId, message);
                this.logger.log(`Inbound stored: ${stored._id}`);
                this.inboxGateway?.broadcastInbound(orgId, stored);
                await this.metaApi.markAsRead(phoneNumberId, waba.accessToken, message.id);
                if (this.flowExecutor) {
                    this.flowExecutor
                        .processInbound(orgId, wabaDbId, message)
                        .catch((err) => this.logger.error(`Flow executor error: ${err.message}`));
                }
            }
            catch (err) {
                this.logger.error(`Error storing inbound: ${err.message}`);
            }
        }
        for (const status of value.statuses || []) {
            try {
                await this.messagesService.updateStatus(status.id, status.status, status.timestamp, status.errors?.[0], orgId);
                this.inboxGateway?.broadcastStatusUpdate(orgId, {
                    metaMessageId: status.id,
                    status: status.status,
                    timestamp: status.timestamp,
                });
            }
            catch (err) {
                this.logger.error(`Error updating status: ${err.message}`);
            }
        }
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService,
        messages_service_1.MessagesService,
        waba_service_1.WabaService,
        meta_api_service_1.MetaApiService,
        flow_executor_1.FlowExecutor,
        inbox_gateway_1.InboxGateway])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map