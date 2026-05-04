import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TemplateDocument = Template & Document;

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

export enum TemplateStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED',
}

@Schema({ timestamps: true })
export class Template {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waba', required: true })
  waba: Types.ObjectId;

  // Meta identifiers
  @Prop({ trim: true })
  metaTemplateId?: string; // ID returned by Meta after creation

  @Prop({ required: true, trim: true })
  name: string; // snake_case, unique per WABA

  @Prop({ enum: TemplateCategory, required: true })
  category: TemplateCategory;

  @Prop({ required: true, trim: true })
  language: string; // e.g. en_US, hi, mr

  @Prop({ enum: TemplateStatus, default: TemplateStatus.PENDING })
  status: TemplateStatus;

  @Prop({ trim: true })
  rejectedReason?: string;

  @Prop({ type: Object })
  qualityScore?: {
    score: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
    date?: number;
    reason?: string;
  };

  // Components — header, body, footer, buttons
  @Prop({ type: [Object], default: [] })
  components: {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    buttons?: {
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }[];
    example?: any;
  }[];

  // Variable placeholders extracted (e.g. ["{{1}}", "{{2}}"])
  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({ type: Date })
  lastSyncedAt?: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
TemplateSchema.index({ organization: 1, waba: 1, name: 1 }, { unique: true });
TemplateSchema.index({ status: 1 });
