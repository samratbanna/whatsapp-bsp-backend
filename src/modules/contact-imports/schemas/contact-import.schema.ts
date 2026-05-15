import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactImportDocument = ContactImport & Document;

export enum ContactImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface FailedRecord {
  rowNumber: number;
  phone: string;
  name?: string;
  reason: string;
}

export interface ParsedContact {
  rowNumber: number;
  phone: string;
  name?: string;
  email?: string;
  customFields: Record<string, string>;
}

@Schema({ timestamps: true })
export class ContactImport {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ required: true, trim: true })
  fileName: string;

  @Prop({ type: Types.ObjectId, ref: 'ContactGroup', required: true })
  groupId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ContactImportStatus,
    default: ContactImportStatus.PENDING,
    index: true,
  })
  status: ContactImportStatus;

  @Prop({ default: 0 })
  totalRows: number;

  @Prop({ default: 0 })
  processedCount: number;

  @Prop({ default: 0 })
  uploadedCount: number;

  @Prop({ default: 0 })
  failedCount: number;

  @Prop({
    type: [{ rowNumber: Number, phone: String, name: String, reason: String, _id: false }],
    default: [],
  })
  failedRecords: FailedRecord[];

  // Parsed rows stored in DB so the worker can operate without the original file.
  // MAX_ROWS guard (10000) is enforced at upload time to stay well under the 16MB document limit.
  @Prop({ type: [Object], default: [] })
  parsedContacts: ParsedContact[];

  @Prop({ trim: true })
  jobId?: string;

  @Prop({ trim: true })
  failureReason?: string;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const ContactImportSchema = SchemaFactory.createForClass(ContactImport);

ContactImportSchema.index({ organization: 1, status: 1 });
ContactImportSchema.index({ organization: 1, createdAt: -1 });
