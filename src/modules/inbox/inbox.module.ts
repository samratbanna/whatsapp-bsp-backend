import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InboxGateway } from './gateways/inbox.gateway';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    MessagesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [InboxGateway],
  exports: [InboxGateway],
})
export class InboxModule {}
