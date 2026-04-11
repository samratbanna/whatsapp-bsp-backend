import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message, MessageDocument, MessageDirection,
  MessageStatus, MessageType,
} from './schemas/message.schema';
import { SendTextDto, SendTemplateDto, SendMediaDto, MessageQueryDto } from './dto/message.dto';
import { WabaService } from '../waba/waba.service';
import { MetaApiService } from '../../common/services/meta-api.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletCategory } from '../wallet/schemas/wallet.schema';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private wabaService: WabaService,
    private metaApi: MetaApiService,
    private walletService: WalletService,
  ) {}

  /**
   * Calls metaApi.sendMessage. On token expiry (Meta error code 190):
   *   1. Exchanges the expired token for a fresh long-lived token.
   *   2. Persists the new token to MongoDB.
   *   3. Retries the send exactly once.
   */
  private async sendWithAutoRefresh(
    waba: any,
    payload: any,
  ): Promise<any> {
    try {
      return await this.metaApi.sendMessage(waba.phoneNumberId, waba.accessToken, payload);
    } catch (err: any) {
      if (!this.metaApi.isTokenExpiredError(err)) throw err;

      this.logger.warn(`WABA ${waba._id}: Meta token expired — exchanging for long-lived token`);
      let newToken: string;
      try {
        newToken = await this.metaApi.exchangeForLongLivedToken(waba.accessToken);
      } catch (refreshErr: any) {
        this.logger.error(`WABA ${waba._id}: token refresh failed`, refreshErr?.response?.data);
        throw err; // rethrow original expiry error
      }

      await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
      this.logger.log(`WABA ${waba._id}: access token updated in DB — retrying send`);

      return this.metaApi.sendMessage(waba.phoneNumberId, newToken, payload);
    }
  }

  // ── Send text message ──────────────────────────────────────────────
  async sendText(orgId: string, dto: SendTextDto): Promise<MessageDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found for this organization');

    // Deduct transactional credit for SHARED WABA
    if (waba.walletBillingEnabled) {
      await this.walletService.deductCredit(orgId, WalletCategory.TRANSACTIONAL);
    }

    const payload = {
      to: dto.to,
      type: 'text',
      text: { body: dto.text, preview_url: false },
    };

    const result = await this.sendWithAutoRefresh(waba, payload);

    return this.messageModel.create({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      metaMessageId: result.messages?.[0]?.id,
      from: waba.displayPhoneNumber,
      to: dto.to,
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEXT,
      status: MessageStatus.SENT,
      content: { text: dto.text },
      sentAt: new Date(),
    });
  }

  // ── Send template message ──────────────────────────────────────────
  async sendTemplate(orgId: string, dto: SendTemplateDto): Promise<MessageDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    // Map template category → wallet category and deduct
    if (waba.walletBillingEnabled) {
      const walletCat = WalletService.toWalletCategory(dto.category || 'UTILITY');
      await this.walletService.deductCredit(orgId, walletCat);
    }

    const payload = {
      to: dto.to,
      type: 'template',
      template: {
        name: dto.templateName,
        language: { code: dto.languageCode },
        components: dto.components || [],
      },
    };

    const result = await this.sendWithAutoRefresh(waba, payload);

    return this.messageModel.create({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      metaMessageId: result.messages?.[0]?.id,
      from: waba.displayPhoneNumber,
      to: dto.to,
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEMPLATE,
      status: MessageStatus.SENT,
      content: {
        templateName: dto.templateName,
        templateLanguage: dto.languageCode,
        templateComponents: dto.components,
      },
      sentAt: new Date(),
    });
  }

  // ── Send media message ─────────────────────────────────────────────
  async sendMedia(orgId: string, dto: SendMediaDto): Promise<MessageDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    // Media sent in service window → transactional credit
    if (waba.walletBillingEnabled) {
      await this.walletService.deductCredit(orgId, WalletCategory.TRANSACTIONAL);
    }

    const typeKey = dto.type.toLowerCase();
    const payload: any = {
      to: dto.to,
      type: typeKey,
      [typeKey]: {
        link: dto.mediaUrl,
        ...(dto.caption   && { caption: dto.caption }),
        ...(dto.filename  && { filename: dto.filename }),
      },
    };

    const result = await this.sendWithAutoRefresh(waba, payload);

    return this.messageModel.create({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      metaMessageId: result.messages?.[0]?.id,
      from: waba.displayPhoneNumber,
      to: dto.to,
      direction: MessageDirection.OUTBOUND,
      type: dto.type,
      status: MessageStatus.SENT,
      content: { mediaUrl: dto.mediaUrl, caption: dto.caption, filename: dto.filename },
      sentAt: new Date(),
    });
  }

  // ── Store inbound message (called by webhook) ──────────────────────
  async storeInbound(orgId: string, wabaId: string, rawMessage: any): Promise<MessageDocument> {
    const existing = await this.messageModel.findOne({
      metaMessageId: rawMessage.id,
    });
    if (existing) return existing; // idempotent

    const contentMap: any = {};
    const type = rawMessage.type as MessageType;

    if (rawMessage.text) contentMap.text = rawMessage.text.body;
    if (rawMessage.image) contentMap.mediaId = rawMessage.image.id;
    if (rawMessage.video) contentMap.mediaId = rawMessage.video.id;
    if (rawMessage.audio) contentMap.mediaId = rawMessage.audio.id;
    if (rawMessage.document) {
      contentMap.mediaId = rawMessage.document.id;
      contentMap.filename = rawMessage.document.filename;
      contentMap.mimeType = rawMessage.document.mime_type;
      contentMap.caption = rawMessage.document.caption;
    }
    if (rawMessage.location) contentMap.location = rawMessage.location;
    if (rawMessage.reaction) contentMap.reaction = rawMessage.reaction;
    if (rawMessage.sticker) contentMap.mediaId = rawMessage.sticker.id;

    // 24-hour conversation window
    const windowExpiry = new Date();
    windowExpiry.setHours(windowExpiry.getHours() + 24);

    return this.messageModel.create({
      organization: new Types.ObjectId(orgId),
      waba: new Types.ObjectId(wabaId),
      metaMessageId: rawMessage.id,
      from: rawMessage.from,
      to: rawMessage.to || '',
      direction: MessageDirection.INBOUND,
      type,
      status: MessageStatus.DELIVERED,
      content: contentMap,
      conversationWindowExpiry: windowExpiry,
      deliveredAt: new Date(),
    });
  }

  // ── Update message status (called by webhook) ──────────────────────
  async updateStatus(
    metaMessageId: string,
    status: string,
    timestamp?: number,
    errorData?: any,
    orgId?: string,
  ): Promise<void> {
    const updateData: any = {};
    const ts = timestamp ? new Date(timestamp * 1000) : new Date();

    switch (status) {
      case 'sent':
        updateData.status = MessageStatus.SENT;
        updateData.sentAt = ts;
        break;
      case 'delivered':
        updateData.status = MessageStatus.DELIVERED;
        updateData.deliveredAt = ts;
        break;
      case 'read':
        updateData.status = MessageStatus.READ;
        updateData.readAt = ts;
        break;
      case 'failed':
        updateData.status = MessageStatus.FAILED;
        updateData.failedAt = ts;
        updateData.failureReason = errorData?.title || 'Unknown error';

        // Refund 1 credit on Meta failure
        if (orgId) {
          this.walletService
            .refundCredit(orgId, metaMessageId, errorData?.title || 'Delivery failed')
            .catch((err) => this.logger.warn(`Refund failed: ${err.message}`));
        }
        break;
    }

    await this.messageModel.findOneAndUpdate(
      { metaMessageId },
      { $set: updateData },
    );
  }

  // ── List messages (conversation view) ─────────────────────────────
  async findAll(orgId: string, query: MessageQueryDto) {
    const filter: any = { organization: new Types.ObjectId(orgId) };
    if (query.phone) {
      filter.$or = [{ from: query.phone }, { to: query.phone }];
    }
    if (query.wabaId) {
      filter.waba = new Types.ObjectId(query.wabaId);
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments(filter),
    ]);

    return { data: messages, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Conversation threads (unique contacts) ─────────────────────────
  async getConversations(orgId: string, wabaId?: string) {
    const match: any = { organization: new Types.ObjectId(orgId) };
    if (wabaId) match.waba = new Types.ObjectId(wabaId);

    return this.messageModel.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$direction', 'inbound'] },
              then: '$from',
              else: '$to',
            },
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$direction', 'inbound'] },
                  { $ne: ['$status', 'read'] },
                ]},
                1, 0,
              ],
            },
          },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 100 },
    ]);
  }

  // ── Stats ──────────────────────────────────────────────────────────
  async getStats(orgId: string) {
    const orgFilter = { organization: new Types.ObjectId(orgId) };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, inbound, outbound, failed] = await Promise.all([
      this.messageModel.countDocuments(orgFilter),
      this.messageModel.countDocuments({ ...orgFilter, createdAt: { $gte: today } }),
      this.messageModel.countDocuments({ ...orgFilter, direction: MessageDirection.INBOUND }),
      this.messageModel.countDocuments({ ...orgFilter, direction: MessageDirection.OUTBOUND }),
      this.messageModel.countDocuments({ ...orgFilter, status: MessageStatus.FAILED }),
    ]);

    return { total, today: todayCount, inbound, outbound, failed };
  }
}
