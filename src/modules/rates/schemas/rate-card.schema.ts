import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Price per message for each credit category, in paise (13 = ₹0.13). Up to two decimals, so
 * 11.5 paise is allowed. null = no rate set for that category.
 */
@Schema({ _id: false })
export class RateCard {
  @Prop({ type: Number, default: null }) transactional: number | null;
  @Prop({ type: Number, default: null }) promotional: number | null;
  @Prop({ type: Number, default: null }) authentication: number | null;
}

export const RateCardSchema = SchemaFactory.createForClass(RateCard);
