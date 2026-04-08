import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../messages/schemas/message.schema';
import { Campaign, CampaignSchema } from '../campaigns/schemas/campaign.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Flow, FlowSchema } from '../flow-builder/schemas/flow.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Campaign.name, schema: CampaignSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Flow.name, schema: FlowSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
