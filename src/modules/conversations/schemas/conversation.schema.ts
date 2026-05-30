import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export enum ConversationStatus {
  OPEN     = 'open',
  RESOLVED = 'resolved',
  ASSIGNED = 'assigned',
}

export enum ConversationOrigin {
  INBOUND  = 'inbound',
  CAMPAIGN = 'campaign',
  MANUAL   = 'manual',
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waba', required: true })
  waba: Types.ObjectId;

  // Contact's phone number in E.164 format
  @Prop({ required: true, trim: true })
  phone: string;

  // Linked contact record — null if phone not in contacts
  @Prop({ type: Types.ObjectId, ref: 'Contact', default: null })
  contact: Types.ObjectId | null;

  @Prop({ enum: ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Prop({ enum: ConversationOrigin, default: ConversationOrigin.INBOUND })
  origin: ConversationOrigin;

  // Set when origin = 'campaign'
  @Prop({ type: Types.ObjectId, ref: 'Campaign', default: null })
  campaign: Types.ObjectId | null;

  // Agent assigned to this conversation
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId | null;

  // Denormalized last message snapshot — avoids extra join on inbox list
  // default: null not supported by Mongoose for nested object schemas — left undefined until first message
  @Prop({
    type: {
      text:      String,
      type:      String,
      direction: String,
      status:    String,
      createdAt: Date,
    },
    _id: false,
  })
  lastMessage: {
    text:      string;
    type:      string;
    direction: string;
    status:    string;
    createdAt: Date;
  } | null;

  // Timestamp of last message — used for inbox sort
  @Prop({ type: Date, default: null })
  lastMessageAt: Date | null;

  // Inbound messages not yet read by any agent
  @Prop({ default: 0 })
  unreadCount: number;

  // Labels applied by agents
  @Prop({ type: [String], default: [] })
  labels: string[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// One conversation per phone per WABA per org
ConversationSchema.index(
  { organization: 1, waba: 1, phone: 1 },
  { unique: true },
);

// Inbox list — latest activity first
ConversationSchema.index({ organization: 1, waba: 1, lastMessageAt: -1 });

// Filter by status
ConversationSchema.index({ organization: 1, waba: 1, status: 1 });

// Filter by campaign
ConversationSchema.index({ organization: 1, campaign: 1 });
