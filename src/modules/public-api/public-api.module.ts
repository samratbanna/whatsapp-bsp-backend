import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicApiLog, PublicApiLogSchema } from './schemas/public-api-log.schema';
import { PublicApiController } from './public-api.controller';
import { RequestLoggerInterceptor } from './interceptors/request-logger.interceptor';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { MessagesModule } from '../messages/messages.module';
import { TemplatesModule } from '../templates/templates.module';
import { WabaModule } from '../waba/waba.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PublicApiLog.name, schema: PublicApiLogSchema }]),
    ApiKeysModule,
    MessagesModule,
    TemplatesModule,
    WabaModule,
    ContactsModule,
  ],
  controllers: [PublicApiController],
  providers: [RequestLoggerInterceptor],
})
export class PublicApiModule {}
