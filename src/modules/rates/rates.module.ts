import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RateSettings,
  RateSettingsSchema,
} from './schemas/rate-settings.schema';
import { RatesService } from './rates.service';
import {
  AdminRatesController,
  PublicRatesController,
} from './rates.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RateSettings.name, schema: RateSettingsSchema },
    ]),
    OrganizationsModule,
  ],
  controllers: [PublicRatesController, AdminRatesController],
  providers: [RatesService],
  exports: [RatesService],
})
export class RatesModule {}
