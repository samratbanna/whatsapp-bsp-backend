import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { MessagesModule } from '../messages/messages.module';
import { WabaModule } from '../waba/waba.module';
import { FlowBuilderModule } from '../flow-builder/flow-builder.module';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [MessagesModule, WabaModule, FlowBuilderModule, InboxModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
