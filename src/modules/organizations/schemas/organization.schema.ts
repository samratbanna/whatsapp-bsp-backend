import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrgStatus } from '../../../common/enums';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // subdomain-friendly unique id

  @Prop({ trim: true })
  logo?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ enum: OrgStatus, default: OrgStatus.TRIAL })
  status: OrgStatus;

  @Prop({ type: Date })
  trialEndsAt?: Date;

  // Usage counters (reset monthly via cron)
  @Prop({ default: 0 })
  messagesUsedThisMonth: number;

  @Prop({ type: Date, default: () => new Date() })
  usageResetAt: Date;

  // WhatsApp Business Account(s) linked — populated later
  @Prop({ type: [Types.ObjectId], ref: 'Waba', default: [] })
  wabaIds: Types.ObjectId[];

  // Billing contact
  @Prop({ trim: true })
  billingEmail?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ trim: true })
  timezone: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ slug: 1 }, { unique: true });
