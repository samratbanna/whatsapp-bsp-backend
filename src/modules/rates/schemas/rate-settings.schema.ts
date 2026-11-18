import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RateCard, RateCardSchema } from './rate-card.schema';

export type RateSettingsDocument = RateSettings & Document;

/** Singleton (key 'global'): what a direct customer pays unless the super admin sets its own rate. */
@Schema({ timestamps: true, collection: 'rate_settings' })
export class RateSettings {
  @Prop({ type: String, required: true, unique: true, default: 'global' })
  key: string;

  // Shown on the website and charged to every direct customer without a rate of its own.
  // Starts unset: nothing can be bought until the super admin enters prices.
  @Prop({ type: RateCardSchema, default: () => ({}) })
  defaultRates: RateCard;

  // Added on top of the message amount.
  @Prop({ type: Number, default: 18 })
  gstPercent: number;

  // Smallest online (Airpay) purchase, in rupees, before GST.
  @Prop({ type: Number, default: 100 })
  minPurchase: number;

  @Prop({ type: String })
  updatedBy?: string;
}

export const RateSettingsSchema = SchemaFactory.createForClass(RateSettings);
