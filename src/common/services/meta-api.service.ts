import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { MetaApiException } from '../exceptions/meta-api.exception';

const META_API_VERSION = 'v19.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);

  constructor(private readonly config: ConfigService) {}

  /** Returns true when the Meta error is an expired/invalid OAuth token (code 190). */
  isTokenExpiredError(err: any): boolean {
    // MetaApiException carries the code directly (thrown by all service methods below).
    if (err instanceof MetaApiException) return err.metaCode === 190;
    // Fallback: raw axios error (e.g. from exchangeForLongLivedToken itself).
    return err?.response?.data?.error?.code === 190;
  }

  /** Converts a raw axios Meta API error into a MetaApiException. */
  private toMetaException(err: any): MetaApiException | BadRequestException {
    const metaErr = err?.response?.data?.error;
    if (metaErr?.code) {
      return new MetaApiException(
        metaErr.code,
        metaErr.error_subcode,
        metaErr.message || 'Meta API error',
        metaErr.error_user_title,
        metaErr.error_user_msg,
      );
    }
    return new BadRequestException(metaErr?.message || 'Meta API error');
  }

  /**
   * Exchanges any valid Meta user access token for a long-lived token (~60 days).
   * Uses META_APP_ID + META_APP_SECRET from environment.
   * Returns the new token and the server-reported expiry (in seconds from now).
   */
  async exchangeForLongLivedToken(
    currentToken: string,
    appId?: string,
    appSecret?: string,
  ): Promise<{ token: string; expiresIn: number }> {
    const resolvedAppId = appId ?? this.config.get<string>('META_APP_ID');
    const resolvedAppSecret = appSecret ?? this.config.get<string>('META_APP_SECRET');
    const res = await axios.get(`${META_BASE_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: resolvedAppId,
        client_secret: resolvedAppSecret,
        fb_exchange_token: currentToken,
      },
    });
    const newToken = res.data?.access_token;
    if (!newToken) throw new BadRequestException('Meta token exchange returned no access_token');
    const expiresIn: number = res.data?.expires_in ?? 5183944; // default ~60 days
    this.logger.log(`Meta long-lived token refreshed successfully (expires in ${Math.round(expiresIn / 86400)} days)`);
    return { token: newToken, expiresIn };
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
      throw this.toMetaException(err);
    }
  }

  /**
   * Sends a message with automatic token-refresh on expiry (Meta error code 190).
   * @param onTokenRefreshed  Async callback invoked with the new token after a
   *                          successful exchange so callers can persist it.
   */
  async sendMessageAutoRefresh(
    phoneNumberId: string,
    accessToken: string,
    payload: any,
    onTokenRefreshed?: (newToken: string) => Promise<void>,
  ): Promise<any> {
    try {
      return await this.sendMessage(phoneNumberId, accessToken, payload);
    } catch (firstErr: any) {
      if (!this.isTokenExpiredError(firstErr)) throw firstErr;

      this.logger.warn(
        `Meta token expired for phoneNumberId ${phoneNumberId} — attempting long-lived token exchange`,
      );

      let newToken: string;
      try {
        const refreshed = await this.exchangeForLongLivedToken(accessToken);
        newToken = refreshed.token;
      } catch (refreshErr: any) {
        this.logger.error(
          'Meta token refresh failed — token is fully expired and requires re-authentication',
          refreshErr?.response?.data ?? refreshErr?.message,
        );
        // Signal to callers that the token is dead (re-throw original 190 error).
        throw firstErr;
      }

      if (onTokenRefreshed) {
        try {
          await onTokenRefreshed(newToken);
        } catch (saveErr: any) {
          this.logger.error('Failed to persist refreshed token', saveErr?.message);
        }
      }

      this.logger.log(`Token refreshed for ${phoneNumberId} — retrying message send`);
      return this.sendMessage(phoneNumberId, newToken, payload);
    }
  }

  // ── Get all templates for a WABA ───────────────────────────────────
  async getTemplates(wabaId: string, accessToken: string) {
    try {
      const res = await this.client(accessToken).get(
        `/${wabaId}/message_templates`,
        {
          params: {
            limit: 100,
            fields: 'id,name,status,category,language,components,rejected_reason,quality_score',
          },
        },
      );
      return res.data?.data || [];
    } catch (err: any) {
      this.logger.error('Meta getTemplates error', err?.response?.data);
      throw this.toMetaException(err);
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
      throw this.toMetaException(err);
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
      throw this.toMetaException(err);
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
      throw this.toMetaException(err);
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
      throw this.toMetaException(err);
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
