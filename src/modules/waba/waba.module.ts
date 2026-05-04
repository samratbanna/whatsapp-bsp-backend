import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Waba, WabaSchema } from './schemas/waba.schema';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { WabaService } from './waba.service';
import { WabaController } from './waba.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Waba.name, schema: WabaSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [WabaController],
  providers: [WabaService],
  exports: [WabaService],
})
export class WabaModule {}
