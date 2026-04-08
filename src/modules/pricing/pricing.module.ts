import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PricingRate, PricingRateSchema, PlanPricing, PlanPricingSchema } from './schemas/pricing.schema';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricingRate.name, schema: PricingRateSchema },
      { name: PlanPricing.name, schema: PlanPricingSchema },
    ]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
