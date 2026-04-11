import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

const META_API_VERSION = 'v19.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);

  constructor(private readonly config: ConfigService) {}

  /** Returns true when the Meta error is an expired/invalid OAuth token (code 190). */
  isTokenExpiredError(err: any): boolean {
    return err?.response?.data?.error?.code === 190;
  }

  /**
   * Exchanges any valid Meta user access token for a long-lived token (~60 days).
   * Uses META_APP_ID + META_APP_SECRET from environment.
   */
  async exchangeForLongLivedToken(currentToken: string): Promise<string> {
    const appId = this.config.get<string>('META_APP_ID');
    const appSecret = this.config.get<string>('META_APP_SECRET');
    const res = await axios.get(`${META_BASE_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: currentToken,
      },
    });
    const newToken = res.data?.access_token;
    if (!newToken) throw new BadRequestException('Meta token exchange returned no access_token');
    this.logger.log('Meta long-lived token refreshed successfully');
    return newToken;
  }

  private client(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: META_BASE_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ── Send a message ─────────────────────────────────────────────────
  async sendMessage(phoneNumberId: string, accessToken: string, payload: any) {
    try {
      const res = await this.client(accessToken).post(
        `/${phoneNumberId}/messages`,
        { messaging_product: 'whatsapp', ...payload },
      );
      return res.data;
    } catch (err: any) {
      this.logger.error('Meta sendMessage error', err?.response?.data);
      throw new BadRequestException(
        err?.response?.data?.error?.message || 'Meta API error',
      );
    }
  }

  // ── Get all templates for a WABA ───────────────────────────────────
  async getTemplates(wabaId: string, accessToken: string) {
    try {
      const res = await this.client(accessToken).get(
        `/${wabaId}/message_templates`,
        { params: { limit: 100 } },
      );
      return res.data?.data || [];
    } catch (err: any) {
      this.logger.error('Meta getTemplates error', err?.response?.data);
      throw new BadRequestException(
        err?.response?.data?.error?.message || 'Meta API error',
      );
    }
  }

  // ── Create template ────────────────────────────────────────────────
  async createTemplate(wabaId: string, accessToken: string, payload: any) {
    try {
      const res = await this.client(accessToken).post(
        `/${wabaId}/message_templates`,
        payload,
      );
      return res.data;
    } catch (err: any) {
      this.logger.error('Meta createTemplate error', err?.response?.data);
      throw new BadRequestException(
        err?.response?.data?.error?.message || 'Meta API error',
      );
    }
  }

  // ── Delete template ────────────────────────────────────────────────
  async deleteTemplate(wabaId: string, accessToken: string, templateName: string) {
    try {
      const res = await this.client(accessToken).delete(
        `/${wabaId}/message_templates`,
        { params: { name: templateName } },
      );
      return res.data;
    } catch (err: any) {
      this.logger.error('Meta deleteTemplate error', err?.response?.data);
      throw new BadRequestException(
        err?.response?.data?.error?.message || 'Meta API error',
      );
    }
  }

  // ── Get phone number info ──────────────────────────────────────────
  async getPhoneNumberInfo(phoneNumberId: string, accessToken: string) {
    try {
      const res = await this.client(accessToken).get(`/${phoneNumberId}`, {
        params: { fields: 'display_phone_number,verified_name,quality_rating' },
      });
      return res.data;
    } catch (err: any) {
      this.logger.error('Meta getPhoneNumberInfo error', err?.response?.data);
      throw new BadRequestException(
        err?.response?.data?.error?.message || 'Meta API error',
      );
    }
  }

  // ── Mark message as read ───────────────────────────────────────────
  async markAsRead(phoneNumberId: string, accessToken: string, messageId: string) {
    try {
      const res = await this.client(accessToken).post(
        `/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
      );
      return res.data;
    } catch (err: any) {
      this.logger.warn('Meta markAsRead error', err?.response?.data);
    }
  }

  // ── Upload media ───────────────────────────────────────────────────
  async uploadMedia(
    phoneNumberId: string,
    accessToken: string,
    buffer: Buffer,
    mimeType: string,
  ) {
    try {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('file', buffer, { contentType: mimeType, filename: 'media' });
      form.append('type', mimeType);
      form.append('messaging_product', 'whatsapp');

      const res = await axios.post(
        `${META_BASE_URL}/${phoneNumberId}/media`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return res.data;
    } catch (err: any) {
      this.logger.error('Meta uploadMedia error', err?.response?.data);
      throw new BadRequestException(
        err?.response?.data?.error?.message || 'Meta API error',
      );
    }
  }

  // ── Verify webhook signature ───────────────────────────────────────
  verifySignature(payload: string, signature: string, appSecret: string): boolean {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    return signature === `sha256=${expected}`;
  }
}
