import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string; // friendly label

  @Prop({ required: true, unique: true, select: false })
  key: string; // bsp_live_xxxxxxxxxxxxxxxx

  @Prop({ required: true })
  keyPrefix: string; // first 12 chars — shown in UI

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: ['messages:send', 'contacts:read', 'templates:read'] })
  scopes: string[]; // granular permissions

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
