import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Job } from 'bull';
import { Campaign, CampaignDocument, CampaignStatus } from '../schemas/campaign.schema';
import { Contact, ContactDocument } from '../../contacts/schemas/contact.schema';
import { WabaService } from '../../waba/waba.service';
import { MetaApiService } from '../../../common/services/meta-api.service';
import { MessagesService } from '../../messages/messages.service';
import { WalletService } from '../../wallet/wallet.service';
import { MessageDirection, MessageStatus, MessageType } from '../../messages/schemas/message.schema';

export const CAMPAIGN_QUEUE = 'campaign';

export interface CampaignJobData {
  campaignId: string;
  orgId: string;
}

@Processor(CAMPAIGN_QUEUE)
export class CampaignProcessor {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    private wabaService: WabaService,
    private metaApi: MetaApiService,
    private messagesService: MessagesService,
    private walletService: WalletService,
  ) {}

  @Process('broadcast')
  async handleBroadcast(job: Job<CampaignJobData>) {
    this.logger.log(`[Processor] handleBroadcast called, jobId=${job.id}`);

    const { campaignId, orgId } = job.data;

    const campaign = await this.campaignModel
      .findById(campaignId)
      .populate('template')
      .exec();

    if (!campaign) {
      this.logger.error(`Campaign ${campaignId} not found`);
      return;
    }

    // Mark as running
    campaign.status = CampaignStatus.RUNNING;
    campaign.startedAt = new Date();
    await campaign.save();

    try {
      const waba = await this.wabaService.findOne(
        campaign.waba.toString(),
        orgId,
      );

      // Collect all target phones
      const phones = await this.collectPhones(campaign, orgId);
      campaign.totalCount = phones.length;
      await campaign.save();

      const delayMs = Math.floor(1000 / (campaign.messagesPerSecond || 10));
      const template = campaign.template as any;
      const walletCat = WalletService.toWalletCategory(template.category || 'UTILITY');

      // Pre-flight: check credits available
      if (waba.walletBillingEnabled) {
        const credits = await this.walletService.getCredits(orgId);
        const available = (credits as any)[walletCat] as number;
        if (available < 1) {
          campaign.status = CampaignStatus.FAILED;
          campaign.failureReason = `No ${walletCat} credits (${available}). Please top up.`;
          await campaign.save();
          this.logger.warn(`Campaign ${campaignId} aborted — no ${walletCat} credits`);
          return;
        }
      }

      this.logger.log(`Campaign ${campaignId}: ${phones.length} contacts, cat=${walletCat}`);

      for (let i = 0; i < phones.length; i++) {
        // Check if campaign was cancelled/paused
        const fresh = await this.campaignModel.findById(campaignId).select('status').exec();
        if (fresh?.status === CampaignStatus.CANCELLED || fresh?.status === CampaignStatus.PAUSED) {
          this.logger.log(`Campaign ${campaignId} stopped at ${i}/${phones.length}`);
          break;
        }

        const { phone, contact } = phones[i];

        try {
          // Deduct 1 credit per message
          if (waba.walletBillingEnabled) {
            try {
              await this.walletService.deductCredit(
                orgId, walletCat,
                undefined, (campaign._id as any).toString(),
              );
            } catch (walletErr: any) {
              const message = this.getErrorMessage(walletErr);
              this.logger.warn(`Campaign ${campaignId} stopped at ${i} - ${message}`);
              campaign.status = CampaignStatus.PAUSED;
              campaign.failureReason = message;
              await campaign.save();
              break;
            }
          }

          // Resolve dynamic variables
          const components = this.resolveVariables(
            template.components || [],
            campaign.templateVariables || {},
            contact,
          );

          const payload = {
            to: phone,
            type: 'template',
            template: {
              name: template.name,
              language: { code: campaign.templateLanguage || 'en_US' },
              components,
            },
          };

          const result = await this.metaApi.sendMessage(
            waba.phoneNumberId,
            waba.accessToken,
            payload,
          );

          // Store message record
          await this.messagesService['messageModel'].create({
            organization: new Types.ObjectId(orgId),
            waba: campaign.waba,
            metaMessageId: result.messages?.[0]?.id,
            from: waba.displayPhoneNumber,
            to: phone,
            direction: MessageDirection.OUTBOUND,
            type: MessageType.TEMPLATE,
            status: MessageStatus.SENT,
            content: {
              templateName: template.name,
              templateLanguage: campaign.templateLanguage,
            },
            campaign: campaign._id,
            sentAt: new Date(),
          });

          campaign.sentCount++;
        } catch (err: any) {
          this.logger.warn(`Failed to send to ${phone}: ${this.getErrorMessage(err)}`);
          campaign.failedCount++;
        }

        // Update progress every 10 messages
        if (i % 10 === 0) {
          await campaign.save();
          await job.progress(Math.floor((i / phones.length) * 100));
        }

        // Throttle
        if (i < phones.length - 1) {
          await this.sleep(delayMs);
        }
      }

      campaign.status = CampaignStatus.COMPLETED;
      campaign.completedAt = new Date();
      await campaign.save();

      this.logger.log(
        `Campaign ${campaignId} completed: ${campaign.sentCount} sent, ${campaign.failedCount} failed`,
      );
    } catch (err: any) {
      const message = this.getErrorMessage(err);
      this.logger.error(`Campaign ${campaignId} failed: ${message}`);
      campaign.status = CampaignStatus.FAILED;
      campaign.failureReason = message;
      await campaign.save();
    }
  }

  // ── Collect all unique phone numbers ──────────────────────────────
  private async collectPhones(
    campaign: CampaignDocument,
    orgId: string,
  ): Promise<{ phone: string; contact: any }[]> {
    const phoneMap = new Map<string, any>();

    // Direct contacts
    if (campaign.contacts?.length) {
      const contacts = await this.contactModel
        .find({
          _id: { $in: campaign.contacts },
          organization: new Types.ObjectId(orgId),
          optedOut: false,
        })
        .select('phone name customFields')
        .exec();

      contacts.forEach((c) => phoneMap.set(c.phone, c));
    }

    // Group contacts
    if (campaign.groups?.length) {
      const contacts = await this.contactModel
        .find({
          groups: { $in: campaign.groups },
          organization: new Types.ObjectId(orgId),
          optedOut: false,
        })
        .select('phone name customFields')
        .exec();

      contacts.forEach((c) => phoneMap.set(c.phone, c));
    }

    return Array.from(phoneMap.entries()).map(([phone, contact]) => ({
      phone,
      contact,
    }));
  }

  // ── Resolve {{contact.name}} etc in template variables ────────────
  private resolveVariables(
    components: any[],
    staticVars: Record<string, string>,
    contact: any,
  ): any[] {
    const resolve = (val: string) =>
      val
        .replace(/\{\{contact\.name\}\}/g, contact?.name || '')
        .replace(/\{\{contact\.phone\}\}/g, contact?.phone || '');

    return components.map((comp) => {
      if (!comp.parameters) return comp;
      return {
        ...comp,
        parameters: comp.parameters.map((param: any) => {
          if (param.type === 'text') {
            const key = param.text?.replace(/\{\{(\d+)\}\}/, '$1');
            const val = staticVars[key] || param.text || '';
            return { ...param, text: resolve(val) };
          }
          return param;
        }),
      };
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : 'Unknown error';
  }
}
