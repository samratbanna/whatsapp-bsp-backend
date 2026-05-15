import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ContactImport, ContactImportSchema } from './schemas/contact-import.schema';
import { ContactImportsService } from './contact-imports.service';
import { ContactImportsController } from './contact-imports.controller';
import {
  ContactImportProcessor,
  CONTACT_IMPORT_QUEUE,
} from './processors/contact-import.processor';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactImport.name, schema: ContactImportSchema },
    ]),
    BullModule.registerQueue({ name: CONTACT_IMPORT_QUEUE }),
    // ContactsModule re-exports MongooseModule, making Contact + ContactGroup
    // model tokens injectable in this module's providers (same pattern as CampaignsModule).
    ContactsModule,
  ],
  controllers: [ContactImportsController],
  providers: [ContactImportsService, ContactImportProcessor],
  exports: [ContactImportsService],
})
export class ContactImportsModule {}
