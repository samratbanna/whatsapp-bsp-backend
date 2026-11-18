import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

/**
 * A message-credit pack sold on the website (one-time purchase, buy as often as you like).
 * Prices are in INR, before GST.
 */
@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  // Credits loaded into the buyer's wallet, per category.
  @Prop({ default: 0, min: 0 }) transactionalCredits: number;
  @Prop({ default: 0, min: 0 }) promotionalCredits: number;
  @Prop({ default: 0, min: 0 }) authenticationCredits: number;

  // Price before tax, INR (up to 2 decimals).
  @Prop({ required: true, min: 1 })
  price: number;

  @Prop({ default: 18, min: 0, max: 100 })
  gstPercent: number;

  // Marketing bullets for the pricing page.
  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: true })
  isActive: boolean;

  // "Most popular" highlight on the pricing page.
  @Prop({ default: false })
  isPopular: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
PlanSchema.index({ isActive: 1, sortOrder: 1, price: 1 });

/** Price breakdown in paise, so totals never pick up float error. */
export function planAmounts(plan: Pick<Plan, 'price' | 'gstPercent'>) {
  const subtotalPaise = Math.round(plan.price * 100);
  const gstPaise = Math.round((subtotalPaise * (plan.gstPercent ?? 0)) / 100);
  return { subtotalPaise, gstPaise, totalPaise: subtotalPaise + gstPaise };
}
