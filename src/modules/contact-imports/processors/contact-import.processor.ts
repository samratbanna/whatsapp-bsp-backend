import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Job } from 'bull';
import {
  ContactImport,
  ContactImportDocument,
  ContactImportStatus,
} from '../schemas/contact-import.schema';
import {
  Contact,
  ContactDocument,
  ContactGroup,
  ContactGroupDocument,
} from '../../contacts/schemas/contact.schema';

export const CONTACT_IMPORT_QUEUE = 'contact-import';

export interface ContactImportJobData {
  importId: string;
  orgId: string;
}

@Processor(CONTACT_IMPORT_QUEUE)
export class ContactImportProcessor {
  private readonly logger = new Logger(ContactImportProcessor.name);

  constructor(
    @InjectModel(ContactImport.name)
    private importModel: Model<ContactImportDocument>,
    @InjectModel(Contact.name)
    private contactModel: Model<ContactDocument>,
    @InjectModel(ContactGroup.name)
    private groupModel: Model<ContactGroupDocument>,
  ) {}

  @Process('process-contacts')
  async handleImport(job: Job<ContactImportJobData>): Promise<void> {
    const { importId, orgId } = job.data;
    this.logger.log(`[Processor] handleImport started, importId=${importId}`);

    const importDoc = await this.importModel.findById(importId).exec();
    if (!importDoc) {
      this.logger.error(`ContactImport ${importId} not found`);
      return;
    }

    importDoc.status = ContactImportStatus.PROCESSING;
    importDoc.startedAt = new Date();
    await importDoc.save();

    const orgObjId = new Types.ObjectId(orgId);
    const groupObjId = importDoc.groupId;
    const contacts = importDoc.parsedContacts;
    const total = contacts.length;

    try {
      for (let i = 0; i < total; i++) {
        const row = contacts[i];
        try {
          // Upsert contact; new: false gives the BEFORE state so we can check group membership
          const before = await this.contactModel.findOneAndUpdate(
            { organization: orgObjId, phone: row.phone },
            {
              $set: {
                ...(row.name && { name: row.name }),
                ...(row.email && { email: row.email }),
                ...(Object.keys(row.customFields ?? {}).length > 0 && {
                  customFields: row.customFields,
                }),
              },
              $setOnInsert: { organization: orgObjId, phone: row.phone },
            },
            { upsert: true, new: false },
          );

          // Add group to contact
          await this.contactModel.updateOne(
            { organization: orgObjId, phone: row.phone },
            { $addToSet: { groups: groupObjId } },
          );

          // Only increment contactCount if this contact wasn't already in the group
          const alreadyInGroup = before?.groups?.some(
            (g) => g.toString() === groupObjId.toString(),
          );
          if (!alreadyInGroup) {
            await this.groupModel.updateOne(
              { _id: groupObjId },
              { $inc: { contactCount: 1 } },
            );
          }

          importDoc.uploadedCount += 1;
        } catch (err) {
          importDoc.failedRecords.push({
            rowNumber: row.rowNumber,
            phone: row.phone,
            name: row.name,
            reason: err?.message ?? 'Unknown error',
          });
          importDoc.failedCount += 1;
        }

        importDoc.processedCount += 1;

        if ((i + 1) % 10 === 0 || i === total - 1) {
          await importDoc.save();
          await job.progress(Math.round(((i + 1) / total) * 100));
        }
      }

      importDoc.status = ContactImportStatus.COMPLETED;
      importDoc.completedAt = new Date();
      await importDoc.save();
      this.logger.log(
        `[Processor] import ${importId} completed: uploaded=${importDoc.uploadedCount} failed=${importDoc.failedCount}`,
      );
    } catch (err) {
      this.logger.error(`[Processor] import ${importId} fatal error: ${err?.message}`);
      importDoc.status = ContactImportStatus.FAILED;
      importDoc.failureReason = err?.message ?? 'Unknown error';
      importDoc.completedAt = new Date();
      await importDoc.save();
    }
  }
}
