import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model, Types } from 'mongoose';
import type { Queue } from 'bull';
import {
  ContactImport,
  ContactImportDocument,
  ContactImportStatus,
  ParsedContact,
  FailedRecord,
} from './schemas/contact-import.schema';
import {
  ContactGroup,
  ContactGroupDocument,
} from '../contacts/schemas/contact.schema';
import { ContactImportQueryDto } from './dto/contact-import.dto';
import { CONTACT_IMPORT_QUEUE } from './processors/contact-import.processor';

const MAX_ROWS = 10_000;

/**
 * Normalizes any Indian phone number format to 91XXXXXXXXXX (12 digits).
 *
 * Handled input formats (all produce the same output):
 *   9988888888        → 10 digits, no country code
 *   09988888888       → 0-prefixed 10 digits
 *   919988888888      → 12 digits with country code
 *   0919988888888     → 0-prefixed 12 digits
 *   +919988888888     → international prefix
 *   +91 99888 88888   → spaces/dashes/brackets ignored
 *
 * Returns null if the number cannot be normalized to a valid Indian mobile.
 */
function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');

  let mobile: string;

  if (digits.length === 10) {
    mobile = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    mobile = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    mobile = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('091')) {
    mobile = digits.slice(3);
  } else {
    return null;
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return null;
  }

  return '91' + mobile;
}

@Injectable()
export class ContactImportsService {
  constructor(
    @InjectModel(ContactImport.name)
    private importModel: Model<ContactImportDocument>,
    @InjectModel(ContactGroup.name)
    private groupModel: Model<ContactGroupDocument>,
    @InjectQueue(CONTACT_IMPORT_QUEUE)
    private importQueue: Queue,
  ) {}

  async createImport(
    orgId: string,
    groupId: string,
    file: Express.Multer.File,
  ): Promise<ContactImportDocument> {
    const group = await this.groupModel.findOne({
      _id: new Types.ObjectId(groupId),
      organization: new Types.ObjectId(orgId),
    });
    if (!group) {
      throw new BadRequestException('Group not found or does not belong to your organization');
    }

    const { valid, preFailedRecords } = await this.parseExcel(file.buffer);

    if (valid.length + preFailedRecords.length > MAX_ROWS) {
      throw new BadRequestException(
        `Excel file exceeds maximum of ${MAX_ROWS} data rows`,
      );
    }

    const importDoc = await this.importModel.create({
      organization: new Types.ObjectId(orgId),
      fileName: file.originalname,
      groupId: new Types.ObjectId(groupId),
      status: ContactImportStatus.PENDING,
      totalRows: valid.length,
      failedCount: preFailedRecords.length,
      failedRecords: preFailedRecords,
      parsedContacts: valid,
    });

    const job = await this.importQueue.add(
      'process-contacts',
      { importId: importDoc._id.toString(), orgId },
      { attempts: 1, removeOnComplete: false, removeOnFail: false },
    );

    importDoc.jobId = job.id.toString();
    await importDoc.save();

    return this.importModel
      .findById(importDoc._id)
      .select('-parsedContacts')
      .exec() as Promise<ContactImportDocument>;
  }

  async findAll(orgId: string, query: ContactImportQueryDto) {
    const { page = 1, limit = 20, status } = query;
    const filter: Record<string, any> = {
      organization: new Types.ObjectId(orgId),
    };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.importModel
        .find(filter)
        .select('-parsedContacts')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.importModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, orgId: string): Promise<ContactImportDocument> {
    const doc = await this.importModel
      .findOne({
        _id: new Types.ObjectId(id),
        organization: new Types.ObjectId(orgId),
      })
      .select('-parsedContacts')
      .exec();

    if (!doc) throw new NotFoundException('Import not found');
    return doc;
  }

  async generateFailureReport(id: string, orgId: string): Promise<Buffer> {
    const doc = await this.importModel
      .findOne({
        _id: new Types.ObjectId(id),
        organization: new Types.ObjectId(orgId),
      })
      .exec();

    if (!doc) throw new NotFoundException('Import not found');

    const ExcelJS = await import('exceljs');
    const WorkbookClass = (ExcelJS as any).default?.Workbook ?? (ExcelJS as any).Workbook;
    const workbook = new WorkbookClass();
    const sheet = workbook.addWorksheet('Failed Records');

    sheet.columns = [
      { header: 'Row #', key: 'rowNumber', width: 10 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Reason', key: 'reason', width: 60 },
    ];
    sheet.getRow(1).font = { bold: true };

    (doc.failedRecords || []).forEach((r) => {
      sheet.addRow({
        rowNumber: r.rowNumber,
        phone: r.phone,
        name: r.name ?? '',
        reason: r.reason,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getCellText(value: any): string {
    if (value == null) return '';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'string') return value.trim();
    // Formula cell: { formula, result }
    if (typeof value === 'object' && 'result' in value) return this.getCellText(value.result);
    // Rich text cell: { richText: [{ text }] }
    if (typeof value === 'object' && 'richText' in value) {
      return (value.richText as any[]).map((rt) => rt.text ?? '').join('').trim();
    }
    // Hyperlink cell: { text, hyperlink }
    if (typeof value === 'object' && 'text' in value) return this.getCellText(value.text);
    return String(value).trim();
  }

  private async parseExcel(buffer: Buffer): Promise<{
    valid: ParsedContact[];
    preFailedRecords: FailedRecord[];
  }> {
    const ExcelJS = await import('exceljs');
    const WorkbookClass = (ExcelJS as any).default?.Workbook ?? (ExcelJS as any).Workbook;
    const workbook = new WorkbookClass();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('Excel file has no worksheets');
    }

    // Read header row (row 1)
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(this.getCellText(cell.value).toLowerCase());
    });

    if (!headers.includes('phone')) {
      throw new BadRequestException(
        "Excel file must have a 'phone' column header in row 1",
      );
    }

    const valid: ParsedContact[] = [];
    const preFailedRecords: FailedRecord[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        values.push(this.getCellText(cell.value));
      });

      // Skip entirely empty rows
      if (values.every((v) => v === '')) return;

      const rowData: Record<string, string> = {};
      headers.forEach((header, idx) => {
        rowData[header] = values[idx] ?? '';
      });

      const rawPhone = rowData['phone'] ?? '';
      const phone = normalizeIndianPhone(rawPhone);
      const name = rowData['name'] ?? '';
      const email = rowData['email'] ?? '';

      if (!phone) {
        preFailedRecords.push({
          rowNumber,
          phone: rawPhone,
          name: name || undefined,
          reason: `Invalid Indian mobile number: "${rawPhone}"`,
        });
        return;
      }

      const customFields: Record<string, string> = {};
      Object.entries(rowData).forEach(([key, val]) => {
        if (!['phone', 'name', 'email'].includes(key) && val !== '') {
          customFields[key] = val;
        }
      });

      valid.push({
        rowNumber,
        phone,
        name: name || undefined,
        email: email || undefined,
        customFields,
      });
    });

    return { valid, preFailedRecords };
  }
}
