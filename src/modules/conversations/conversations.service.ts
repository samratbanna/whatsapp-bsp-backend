import {
  Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation, ConversationDocument,
  ConversationOrigin, ConversationStatus,
} from './schemas/conversation.schema';
import {
  Message, MessageDocument,
  MessageDirection, MessageStatus, MessageType,
} from '../messages/schemas/message.schema';
import {
  ConversationListDto, ConversationMessagesDto,
} from './dto/conversation.dto';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';

// Map message types to readable inbox preview text
const MEDIA_PREVIEW: Partial<Record<MessageType, string>> = {
  [MessageType.IMAGE]:    '📷 Image',
  [MessageType.VIDEO]:    '🎥 Video',
  [MessageType.AUDIO]:    '🎵 Audio',
  [MessageType.DOCUMENT]: '📄 Document',
  [MessageType.STICKER]:  '🪄 Sticker',
  [MessageType.LOCATION]: '📍 Location',
  [MessageType.REACTION]: '👍 Reaction',
  [MessageType.CONTACTS]: '👤 Contact',
};

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,

    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,

    @InjectModel(Contact.name)
    private contactModel: Model<ContactDocument>,
  ) {}

  // ── Find or create a conversation (called by webhook on every inbound) ──

  async findOrCreate(
    orgId: string,
    wabaId: string,
    phone: string,
    origin: ConversationOrigin,
    campaignId?: string | null,
  ): Promise<{ conversation: ConversationDocument; isNew: boolean }> {

    const query = {
      organization: new Types.ObjectId(orgId),
      waba:         new Types.ObjectId(wabaId),
      phone,
    };

    // Check for existing conversation first
    const existing = await this.conversationModel.findOne(query);

    if (existing) {
      // Auto-reopen if previously resolved
      if (existing.status === ConversationStatus.RESOLVED) {
        existing.status = ConversationStatus.OPEN;
        await existing.save();
        this.logger.log(`Conversation ${existing._id} re-opened (was resolved)`);
      }
      return { conversation: existing, isNew: false };
    }

    // Lookup contact to link (best-effort, no throw)
    let contactId: Types.ObjectId | null = null;
    try {
      const contact = await this.contactModel
        .findOne({ organization: new Types.ObjectId(orgId), phone })
        .select('_id')
        .lean();
      if (contact) contactId = contact._id as Types.ObjectId;
    } catch { /* no contact — ok */ }

    // Create new conversation — unique index handles rare concurrent duplicates
    try {
      const conversation = await this.conversationModel.create({
        organization:  new Types.ObjectId(orgId),
        waba:          new Types.ObjectId(wabaId),
        phone,
        origin,
        campaign:      campaignId ? new Types.ObjectId(campaignId) : null,
        contact:       contactId,
        status:        ConversationStatus.OPEN,
        unreadCount:   0,
        labels:        [],
        assignedTo:    null,
      });
      this.logger.log(`New conversation created: ${conversation._id} (phone: ${phone})`);
      return { conversation, isNew: true };
    } catch (err: any) {
      // Duplicate key: concurrent webhook fired — fetch the one that won
      if (err.code === 11000) {
        const conv = await this.conversationModel.findOne(query);
        return { conversation: conv!, isNew: false };
      }
      throw err;
    }
  }

  // ── Update lastMessage snapshot + unreadCount after any message ──

  async updateAfterMessage(
    conversationId: string,
    message: MessageDocument,
  ): Promise<ConversationDocument> {

    const previewText =
      message.content?.text ||
      MEDIA_PREVIEW[message.type] ||
      message.type;

    const update: any = {
      lastMessage: {
        text:      previewText,
        type:      message.type,
        direction: message.direction,
        status:    message.status,
        createdAt: (message as any).createdAt || new Date(),
      },
      lastMessageAt: (message as any).createdAt || new Date(),
    };

    // Increment unread only for inbound messages
    if (message.direction === MessageDirection.INBOUND) {
      update.$inc = { unreadCount: 1 };
    }

    const updated = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      message.direction === MessageDirection.INBOUND
        ? { $set: update, $inc: { unreadCount: 1 } }
        : { $set: update },
      { new: true },
    );

    return updated!;
  }

  // ── Paginated inbox list ──

  async list(orgId: string, dto: ConversationListDto) {
    const page  = dto.page  || 1;
    const limit = dto.limit || 30;
    const skip  = (page - 1) * limit;

    const filter: any = {
      organization: new Types.ObjectId(orgId),
      waba:         new Types.ObjectId(dto.wabaId),
    };

    if (dto.status)     filter.status     = dto.status;
    if (dto.assignedTo) filter.assignedTo = new Types.ObjectId(dto.assignedTo);
    if (dto.campaignId) filter.campaign   = new Types.ObjectId(dto.campaignId);
    if (dto.label)      filter.labels     = { $in: [dto.label] };

    if (dto.search) {
      // Search by phone (prefix) or find matching contact names
      const contactIds = await this.contactModel
        .find({
          organization: new Types.ObjectId(orgId),
          $or: [
            { name:  { $regex: dto.search, $options: 'i' } },
            { phone: { $regex: dto.search, $options: 'i' } },
          ],
        })
        .select('_id')
        .lean();

      filter.$or = [
        { phone: { $regex: dto.search, $options: 'i' } },
        { contact: { $in: contactIds.map((c) => c._id) } },
      ];
    }

    const [data, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('contact', 'name avatar labels')
        .populate('assignedTo', 'name email')
        .populate('campaign', 'name')
        .lean(),
      this.conversationModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Single conversation ──

  async findOne(orgId: string, conversationId: string): Promise<ConversationDocument> {
    const conv = await this.conversationModel
      .findOne({
        _id:          new Types.ObjectId(conversationId),
        organization: new Types.ObjectId(orgId),
      })
      .populate('contact',    'name avatar labels phone email')
      .populate('assignedTo', 'name email')
      .populate('campaign',   'name status')
      .exec();

    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // ── Message history for a conversation (chat style: oldest first) ──

  async getMessages(
    orgId: string,
    conversationId: string,
    dto: ConversationMessagesDto,
  ) {
    const conv = await this.conversationModel
      .findOne({
        _id:          new Types.ObjectId(conversationId),
        organization: new Types.ObjectId(orgId),
      })
      .select('phone waba')
      .lean();

    if (!conv) throw new NotFoundException('Conversation not found');

    const page  = dto.page  || 1;
    const limit = dto.limit || 50;
    const skip  = (page - 1) * limit;

    const filter = {
      organization: new Types.ObjectId(orgId),
      waba:         conv.waba,
      $or: [{ from: conv.phone }, { to: conv.phone }],
    };

    const [messages, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: 1 })   // oldest first — chat style
        .skip(skip)
        .limit(limit)
        .lean(),
      this.messageModel.countDocuments(filter),
    ]);

    return { data: messages, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Mark conversation as read (clear unread badge) ──

  async markRead(orgId: string, conversationId: string): Promise<{ updated: number }> {
    const conv = await this.conversationModel
      .findOne({
        _id:          new Types.ObjectId(conversationId),
        organization: new Types.ObjectId(orgId),
      })
      .select('phone waba unreadCount')
      .lean();

    if (!conv) throw new NotFoundException('Conversation not found');

    // Reset unread counter on conversation
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { unreadCount: 0 },
    });

    // Bulk-mark all inbound messages from this phone as read
    const result = await this.messageModel.updateMany(
      {
        organization: new Types.ObjectId(orgId),
        waba:         conv.waba,
        from:         conv.phone,
        direction:    MessageDirection.INBOUND,
        status:       { $ne: MessageStatus.READ },
      },
      { $set: { status: MessageStatus.READ, readAt: new Date() } },
    );

    return { updated: result.modifiedCount };
  }

  // ── Update status (open / resolved) ──

  async updateStatus(
    orgId: string,
    conversationId: string,
    status: ConversationStatus,
  ): Promise<ConversationDocument> {
    const conv = await this.conversationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(conversationId), organization: new Types.ObjectId(orgId) },
      { $set: { status } },
      { new: true },
    );
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // ── Assign agent ──

  async assignAgent(
    orgId: string,
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    const conv = await this.conversationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(conversationId), organization: new Types.ObjectId(orgId) },
      { $set: { assignedTo: new Types.ObjectId(userId), status: ConversationStatus.ASSIGNED } },
      { new: true },
    );
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // ── Update labels ──

  async updateLabels(
    orgId: string,
    conversationId: string,
    labels: string[],
  ): Promise<ConversationDocument> {
    const conv = await this.conversationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(conversationId), organization: new Types.ObjectId(orgId) },
      { $set: { labels } },
      { new: true },
    );
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }
}
