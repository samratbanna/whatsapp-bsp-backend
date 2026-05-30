import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from '../messages/schemas/message.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { InboxModule } from '../inbox/inbox.module';

@Module({
  imports: [
    // Models injected directly to avoid circular dependency with MessagesModule
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name,      schema: MessageSchema },
      { name: Contact.name,      schema: ContactSchema },
    ]),
    InboxModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
