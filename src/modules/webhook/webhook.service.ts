import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { WabaService } from '../waba/waba.service';
import { MetaApiService } from '../../common/services/meta-api.service';
import { FlowExecutor } from '../flow-builder/executors/flow.executor';
import { InboxGateway } from '../inbox/gateways/inbox.gateway';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private config: ConfigService,
    private messagesService: MessagesService,
    private wabaService: WabaService,
    private metaApi: MetaApiService,
    @Optional() private flowExecutor?: FlowExecutor,
    @Optional() private inboxGateway?: InboxGateway,
  ) {}

  verifyToken(token: string): boolean {
    const expected = this.config.get<string>('META_WEBHOOK_VERIFY_TOKEN');
    return token === expected;
  }

  async processEvent(body: any, signature: string, rawBody?: Buffer): Promise<void> {
    if (signature && rawBody) {
      const appSecret = this.config.get<string>('META_APP_SECRET');
      if (appSecret) {
        const valid = this.metaApi.verifySignature(rawBody.toString(), signature, appSecret);
        if (!valid) {
          this.logger.warn('Invalid webhook signature — ignoring event');
          return;
        }
      }
    }

    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        await this.processChange(change.value);
      }
    }
  }

  private async processChange(value: any): Promise<void> {
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!phoneNumberId) return;

    const waba = await this.wabaService.findByPhoneNumberId(phoneNumberId);
    if (!waba) {
      this.logger.warn(`No WABA found for phoneNumberId: ${phoneNumberId}`);
      return;
    }

    const orgId = waba.organization.toString();
    const wabaDbId = (waba._id as any).toString();

    // ── Inbound messages ───────────────────────────────────────────
    for (const message of value.messages || []) {
      try {
        const stored = await this.messagesService.storeInbound(orgId, wabaDbId, message);
        this.logger.log(`Inbound stored: ${stored._id}`);

        // Broadcast to live inbox via Socket.io
        this.inboxGateway?.broadcastInbound(orgId, stored);

        // Auto mark as read
        await this.metaApi.markAsRead(phoneNumberId, waba.accessToken, message.id);

        // Run through flow executor
        if (this.flowExecutor) {
          this.flowExecutor
            .processInbound(orgId, wabaDbId, message)
            .catch((err) => this.logger.error(`Flow executor error: ${err.message}`));
        }
      } catch (err) {
        this.logger.error(`Error storing inbound: ${err.message}`);
      }
    }

    // ── Status updates ─────────────────────────────────────────────
    for (const status of value.statuses || []) {
      try {
        await this.messagesService.updateStatus(
          status.id,
          status.status,
          status.timestamp,
          status.errors?.[0],
          orgId, // pass orgId for refund on failure
        );
        this.inboxGateway?.broadcastStatusUpdate(orgId, {
          metaMessageId: status.id,
          status: status.status,
          timestamp: status.timestamp,
        });
      } catch (err) {
        this.logger.error(`Error updating status: ${err.message}`);
      }
    }
  }
}
