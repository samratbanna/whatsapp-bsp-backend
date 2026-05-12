import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PublicApiLogDocument = PublicApiLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class PublicApiLog {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: Types.ObjectId;

  @Prop()
  apiKeyPrefix: string;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  statusCode: number;

  @Prop()
  ip: string;

  @Prop({ required: true, index: true })
  requestId: string;

  @Prop({ required: true })
  durationMs: number;

  @Prop({ type: Date, expires: '90d', default: Date.now })
  createdAt: Date;
}

export const PublicApiLogSchema = SchemaFactory.createForClass(PublicApiLog);
