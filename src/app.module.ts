import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

// Phase 1
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AppConfigModule } from './modules/app-config/app-config.module';

// Phase 2
import { WabaModule } from './modules/waba/waba.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { MessagesModule } from './modules/messages/messages.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ContactsModule } from './modules/contacts/contacts.module';

// Phase 3
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { FlowBuilderModule } from './modules/flow-builder/flow-builder.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PricingModule } from './modules/pricing/pricing.module';

@Module({
  imports: [
    // Core config
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        dbName: 'whatsapp-bsp',
      }),
      inject: [ConfigService],
    }),

    // BullMQ — Redis backed queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Cron scheduler
    ScheduleModule.forRoot(),

    // Phase 1
    CommonModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AppConfigModule,

    // Phase 2
    WabaModule,
    WebhookModule,
    MessagesModule,
    TemplatesModule,
    ContactsModule,

    // Phase 3
    CampaignsModule,
    InboxModule,
    FlowBuilderModule,
    ApiKeysModule,
    AnalyticsModule,
    WalletModule,
    PricingModule,
  ],
})
export class AppModule {}
