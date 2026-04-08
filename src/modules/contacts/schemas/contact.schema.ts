import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ required: true, trim: true })
  phone: string; // E.164 format e.g. 919876543210

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  avatar?: string;

  // Grouping
  @Prop({ type: [{ type: Types.ObjectId, ref: 'ContactGroup' }], default: [] })
  groups: Types.ObjectId[];

  // Custom fields (flexible key-value for CRM data)
  @Prop({ type: Object, default: {} })
  customFields: Record<string, string>;

  // WhatsApp metadata
  @Prop({ default: true })
  isWhatsAppUser: boolean;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  // Opt-out
  @Prop({ default: false })
  optedOut: boolean;

  @Prop({ type: Date })
  optedOutAt?: Date;

  // Notes
  @Prop({ trim: true })
  notes?: string;

  // Labels / tags
  @Prop({ type: [String], default: [] })
  labels: string[];
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
ContactSchema.index({ organization: 1, phone: 1 }, { unique: true });
ContactSchema.index({ organization: 1, name: 'text', phone: 'text' });

// ── Contact Group ──────────────────────────────────────────────────────

export type ContactGroupDocument = ContactGroup & Document;

@Schema({ timestamps: true })
export class ContactGroup {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 0 })
  contactCount: number;
}

export const ContactGroupSchema = SchemaFactory.createForClass(ContactGroup);
ContactGroupSchema.index({ organization: 1, name: 1 }, { unique: true });
