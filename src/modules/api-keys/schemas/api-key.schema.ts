import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, unique: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string; // friendly label

  @Prop({ required: true, select: false })
  keyHash: string; // sha256 hash of full key

  @Prop({ required: true })
  keyPrefix: string; // first 16 chars — shown in UI

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  scopes: string[]; // granular permissions, [] means all access

  @Prop({ type: [String], default: [] })
  allowedIps: string[]; // [] means all IPs allowed

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
