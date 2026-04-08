import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageDirection {
  INBOUND = 'inbound',   // customer → business
  OUTBOUND = 'outbound', // business → customer
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
  LOCATION = 'location',
  STICKER = 'sticker',
  REACTION = 'reaction',
  CONTACTS = 'contacts',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waba', required: true })
  waba: Types.ObjectId;

  // Meta message IDs
  @Prop({ trim: true, index: true })
  metaMessageId?: string; // wamid from Meta

  @Prop({ trim: true })
  metaConversationId?: string;

  // Parties
  @Prop({ required: true, trim: true })
  from: string; // phone number

  @Prop({ required: true, trim: true })
  to: string; // phone number

  @Prop({ enum: MessageDirection, required: true })
  direction: MessageDirection;

  @Prop({ enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ enum: MessageStatus, default: MessageStatus.QUEUED })
  status: MessageStatus;

  // Content
  @Prop({ type: Object })
  content: {
    text?: string;
    mediaUrl?: string;
    mediaId?: string; // Meta media ID
    mimeType?: string;
    caption?: string;
    filename?: string;
    templateName?: string;
    templateLanguage?: string;
    templateComponents?: any[];
    interactive?: any;
    location?: { latitude: number; longitude: number; name?: string; address?: string };
    reaction?: { messageId: string; emoji: string };
  };

  // Contact linked (if known)
  @Prop({ type: Types.ObjectId, ref: 'Contact', default: null })
  contact: Types.ObjectId | null;

  // Status timestamps
  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Date })
  failedAt?: Date;

  @Prop({ trim: true })
  failureReason?: string;

  // Conversation window (24h)
  @Prop({ type: Date })
  conversationWindowExpiry?: Date;

  // Campaign reference
  @Prop({ type: Types.ObjectId, ref: 'Campaign', default: null })
  campaign: Types.ObjectId | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ organization: 1, from: 1, createdAt: -1 });
MessageSchema.index({ metaMessageId: 1 });
MessageSchema.index({ organization: 1, createdAt: -1 });
