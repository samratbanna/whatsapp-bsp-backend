import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PricingRateDocument = PricingRate & Document;

export enum MessageCategory {
  MARKETING = 'marketing',
  UTILITY = 'utility',
  AUTHENTICATION = 'authentication',
  SERVICE = 'service',
}

// One global pricing config (singleton) — super admin manages this
@Schema({ timestamps: true })
export class PricingRate {
  @Prop({ required: true, unique: true, default: 'global' })
  key: string; // always 'global'

  // Meta official base rates (INR) — updated by super admin
  @Prop({ default: 0.88 }) marketingBase: number;
  @Prop({ default: 0.13 }) utilityBase: number;
  @Prop({ default: 0.13 }) authenticationBase: number;
  @Prop({ default: 0 })   serviceBase: number; // free

  // Your markup (INR per message) — your profit
  @Prop({ default: 0.12 }) marketingMarkup: number;
  @Prop({ default: 0.05 }) utilityMarkup: number;
  @Prop({ default: 0.05 }) authenticationMarkup: number;
  @Prop({ default: 0 })   serviceMarkup: number;

  // Computed effective rates (base + markup) — stored for quick lookup
  @Prop({ default: 1.00 }) marketingEffective: number;
  @Prop({ default: 0.18 }) utilityEffective: number;
  @Prop({ default: 0.18 }) authenticationEffective: number;
  @Prop({ default: 0 })   serviceEffective: number;

  @Prop({ type: Date })
  lastUpdatedBy?: string;
}

export const PricingRateSchema = SchemaFactory.createForClass(PricingRate);

// ── Per-plan pricing override (optional) ──────────────────────────────
// Super admin can give specific plans different rates
export type PlanPricingDocument = PlanPricing & Document;

@Schema({ timestamps: true })
export class PlanPricing {
  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true, unique: true })
  plan: Types.ObjectId;

  // If set, overrides global markup for this plan
  @Prop() marketingEffective?: number;
  @Prop() utilityEffective?: number;
  @Prop() authenticationEffective?: number;
  @Prop() serviceEffective?: number;
}

export const PlanPricingSchema = SchemaFactory.createForClass(PlanPricing);
