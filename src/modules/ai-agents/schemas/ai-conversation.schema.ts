import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiConversationDocument = AiConversation & Document;

export enum AiConversationStatus {
  ACTIVE      = 'active',
  HANDED_OFF  = 'handed_off',
  RESOLVED    = 'resolved',
}

export class AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Schema({ timestamps: true })
export class AiConversation {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AiAgent', required: true, index: true })
  agentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waba' })
  wabaId?: Types.ObjectId;

  // WhatsApp phone number (e.g. 919876543210)
  @Prop({ required: true, index: true })
  phone: string;

  // Rolling message history (trimmed to maxHistoryTurns * 2)
  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: Date,
      },
    ],
    default: [],
  })
  messages: AiMessage[];

  // Total turns since conversation started (used for maxTurnsBeforeHandoff)
  @Prop({ default: 0 })
  turnCount: number;

  @Prop({ enum: AiConversationStatus, default: AiConversationStatus.ACTIVE })
  status: AiConversationStatus;

  @Prop()
  handoffReason?: string;

  @Prop({ default: Date.now, index: true })
  lastMessageAt: Date;
}

export const AiConversationSchema = SchemaFactory.createForClass(AiConversation);
AiConversationSchema.index({ agentId: 1, phone: 1 }, { unique: true });
AiConversationSchema.index({ organization: 1, status: 1 });
AiConversationSchema.index({ lastMessageAt: 1 });
