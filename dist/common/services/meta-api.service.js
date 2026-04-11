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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MetaApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const META_API_VERSION = 'v19.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
let MetaApiService = MetaApiService_1 = class MetaApiService {
    config;
    logger = new common_1.Logger(MetaApiService_1.name);
    constructor(config) {
        this.config = config;
    }
    isTokenExpiredError(err) {
        return err?.response?.data?.error?.code === 190;
    }
    async exchangeForLongLivedToken(currentToken) {
        const appId = this.config.get('META_APP_ID');
        const appSecret = this.config.get('META_APP_SECRET');
        const res = await axios_1.default.get(`${META_BASE_URL}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: currentToken,
            },
        });
        const newToken = res.data?.access_token;
        if (!newToken)
            throw new common_1.BadRequestException('Meta token exchange returned no access_token');
        this.logger.log('Meta long-lived token refreshed successfully');
        return newToken;
    }
    client(accessToken) {
        return axios_1.default.create({
            baseURL: META_BASE_URL,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    }
    async sendMessage(phoneNumberId, accessToken, payload) {
        try {
            const res = await this.client(accessToken).post(`/${phoneNumberId}/messages`, { messaging_product: 'whatsapp', ...payload });
            return res.data;
        }
        catch (err) {
            this.logger.error('Meta sendMessage error', err?.response?.data);
            throw new common_1.BadRequestException(err?.response?.data?.error?.message || 'Meta API error');
        }
    }
    async getTemplates(wabaId, accessToken) {
        try {
            const res = await this.client(accessToken).get(`/${wabaId}/message_templates`, { params: { limit: 100 } });
            return res.data?.data || [];
        }
        catch (err) {
            this.logger.error('Meta getTemplates error', err?.response?.data);
            throw new common_1.BadRequestException(err?.response?.data?.error?.message || 'Meta API error');
        }
    }
    async createTemplate(wabaId, accessToken, payload) {
        try {
            const res = await this.client(accessToken).post(`/${wabaId}/message_templates`, payload);
            return res.data;
        }
        catch (err) {
            this.logger.error('Meta createTemplate error', err?.response?.data);
            throw new common_1.BadRequestException(err?.response?.data?.error?.message || 'Meta API error');
        }
    }
    async deleteTemplate(wabaId, accessToken, templateName) {
        try {
            const res = await this.client(accessToken).delete(`/${wabaId}/message_templates`, { params: { name: templateName } });
            return res.data;
        }
        catch (err) {
            this.logger.error('Meta deleteTemplate error', err?.response?.data);
            throw new common_1.BadRequestException(err?.response?.data?.error?.message || 'Meta API error');
        }
    }
    async getPhoneNumberInfo(phoneNumberId, accessToken) {
        try {
            const res = await this.client(accessToken).get(`/${phoneNumberId}`, {
                params: { fields: 'display_phone_number,verified_name,quality_rating' },
            });
            return res.data;
        }
        catch (err) {
            this.logger.error('Meta getPhoneNumberInfo error', err?.response?.data);
            throw new common_1.BadRequestException(err?.response?.data?.error?.message || 'Meta API error');
        }
    }
    async markAsRead(phoneNumberId, accessToken, messageId) {
        try {
            const res = await this.client(accessToken).post(`/${phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            });
            return res.data;
        }
        catch (err) {
            this.logger.warn('Meta markAsRead error', err?.response?.data);
        }
    }
    async uploadMedia(phoneNumberId, accessToken, buffer, mimeType) {
        try {
            const FormData = (await import('form-data')).default;
            const form = new FormData();
            form.append('file', buffer, { contentType: mimeType, filename: 'media' });
            form.append('type', mimeType);
            form.append('messaging_product', 'whatsapp');
            const res = await axios_1.default.post(`${META_BASE_URL}/${phoneNumberId}/media`, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return res.data;
        }
        catch (err) {
            this.logger.error('Meta uploadMedia error', err?.response?.data);
            throw new common_1.BadRequestException(err?.response?.data?.error?.message || 'Meta API error');
        }
    }
    verifySignature(payload, signature, appSecret) {
        const crypto = require('crypto');
        const expected = crypto
            .createHmac('sha256', appSecret)
            .update(payload)
            .digest('hex');
        return signature === `sha256=${expected}`;
    }
};
exports.MetaApiService = MetaApiService;
exports.MetaApiService = MetaApiService = MetaApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MetaApiService);
//# sourceMappingURL=meta-api.service.js.map