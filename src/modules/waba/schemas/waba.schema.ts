import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WabaDocument = Waba & Document;

export enum WabaStatus {
  ACTIVE = 'active',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  BANNED = 'banned',
}

export enum WabaOwnershipType {
  BYO = 'byo',       // Bring Your Own — client's own Meta account
  SHARED = 'shared', // BSP owned number — assigned by super admin
}

@Schema({ timestamps: true })
export class Waba {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organization: Types.ObjectId;

  // Ownership — set by super admin
  @Prop({ enum: WabaOwnershipType, default: WabaOwnershipType.BYO })
  ownershipType: WabaOwnershipType;

  // Meta credentials
  @Prop({ required: true, trim: true })
  wabaId: string;

  @Prop({ required: true, trim: true })
  phoneNumberId: string;

  @Prop({ required: true, trim: true })
  displayPhoneNumber: string;

  @Prop({ trim: true })
  verifiedName?: string;

  @Prop({ required: true, select: false })
  accessToken: string;

  // Status & quality
  @Prop({ enum: WabaStatus, default: WabaStatus.ACTIVE })
  status: WabaStatus;

  @Prop({ trim: true })
  qualityRating?: string;

  @Prop({ trim: true })
  webhookVerifyToken?: string;

  @Prop({ default: true })
  isDefault: boolean;

  @Prop({ trim: true })
  label?: string;

  // For SHARED type — which BSP pool number this is from
  @Prop({ trim: true })
  poolLabel?: string; // e.g. "Pool India 1"

  // Wallet billing:
  // BYO  → Meta charges client directly, no wallet deduction
  // SHARED → wallet deducted per message
  @Prop({ default: true })
  walletBillingEnabled: boolean;
}

export const WabaSchema = SchemaFactory.createForClass(Waba);
WabaSchema.index({ organization: 1 });
WabaSchema.index({ phoneNumberId: 1 }, { unique: true });
WabaSchema.index({ wabaId: 1 });
