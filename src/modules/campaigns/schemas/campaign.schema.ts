import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CampaignDocument = Campaign & Document;

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CampaignType {
  BROADCAST = 'broadcast',       // send to contact list / group
  SCHEDULED = 'scheduled',       // future date/time
}

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waba', required: true })
  waba: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: CampaignType, default: CampaignType.BROADCAST })
  type: CampaignType;

  @Prop({ enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  // Template to send
  @Prop({ type: Types.ObjectId, ref: 'Template', required: true })
  template: Types.ObjectId;

  @Prop({ trim: true })
  templateLanguage: string;

  // Static variable values for template e.g. { "1": "John", "2": "Order #123" }
  // Use {{contact.name}}, {{contact.phone}} for dynamic per-contact substitution
  @Prop({ type: Object, default: {} })
  templateVariables: Record<string, string>;

  // Audience — either contactIds OR groupIds
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Contact' }], default: [] })
  contacts: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ContactGroup' }], default: [] })
  groups: Types.ObjectId[];

  // Scheduling
  @Prop({ type: Date })
  scheduledAt?: Date;

  // Progress tracking
  @Prop({ default: 0 })
  totalCount: number;

  @Prop({ default: 0 })
  sentCount: number;

  @Prop({ default: 0 })
  deliveredCount: number;

  @Prop({ default: 0 })
  readCount: number;

  @Prop({ default: 0 })
  failedCount: number;

  // Throttle — messages per second (Meta rate limit safe)
  @Prop({ default: 10 })
  messagesPerSecond: number;

  // BullMQ job ID for tracking/cancellation
  @Prop({ trim: true })
  jobId?: string;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ trim: true })
  failureReason?: string;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.index({ organization: 1, status: 1 });
CampaignSchema.index({ scheduledAt: 1, status: 1 });
