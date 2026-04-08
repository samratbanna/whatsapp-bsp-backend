import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignProcessor, CAMPAIGN_QUEUE } from './processors/campaign.processor';
import { WabaModule } from '../waba/waba.module';
import { MessagesModule } from '../messages/messages.module';
import { ContactsModule } from '../contacts/contacts.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Campaign.name, schema: CampaignSchema }]),
    BullModule.registerQueue({ name: CAMPAIGN_QUEUE }),
    WabaModule,
    MessagesModule,
    ContactsModule,
    WalletModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignProcessor],
  exports: [CampaignsService],
})
export class CampaignsModule {}
