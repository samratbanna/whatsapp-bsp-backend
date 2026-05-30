import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Template,
  TemplateDocument,
  TemplateStatus,
} from './schemas/template.schema';
import { CreateTemplateDto, UpdateTemplateDto, TemplateQueryDto } from './dto/template.dto';
import { WabaService } from '../waba/waba.service';
import { MetaApiService } from '../../common/services/meta-api.service';

const TEMPLATE_MEDIA_LIMITS = [
  {
    label: 'Images',
    matches: (mimeType: string) =>
      ['image/jpeg', 'image/png'].includes(mimeType),
    maxBytes: 5 * 1024 * 1024,
  },
  {
    label: 'Videos',
    matches: (mimeType: string) => mimeType === 'video/mp4',
    maxBytes: 16 * 1024 * 1024,
  },
  {
    label: 'Documents',
    matches: (mimeType: string) =>
      [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(mimeType),
    maxBytes: 100 * 1024 * 1024,
  },
];

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
    private wabaService: WabaService,
    private metaApi: MetaApiService,
  ) { }

  private extractVariables(components: any[]): string[] {
    const vars: Set<string> = new Set();
    const regex = /\{\{(\d+)\}\}/g;
    for (const comp of components) {
      const text = comp.text || '';
      let match;
      while ((match = regex.exec(text)) !== null) {
        vars.add(`{{${match[1]}}}`);
      }
    }
    return Array.from(vars);
  }

  // ── Create + submit to Meta ────────────────────────────────────────
  async create(
    orgId: string,
    dto: CreateTemplateDto,
  ): Promise<TemplateDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    const existing = await this.templateModel.findOne({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      name: dto.name,
    });
    if (existing)
      throw new BadRequestException('Template with this name already exists');

    // Build clean per-type components for the Meta API (no undefined fields)
    const metaComponents: any[] = [];
    for (const comp of dto.components) {
      const type = (comp.type || '').toUpperCase();

      if (type === 'HEADER') {
        if (comp.format && comp.format !== 'TEXT' && comp.mediaId) {
          // Media header — split "uploadHandle|||standardId" written by uploadMedia
          let handle = comp.mediaId;
          let standardId = comp.mediaId;
          if (comp.mediaId.includes('|||')) {
            [handle, standardId] = comp.mediaId.split('|||');
            (comp as any).mediaId = standardId; // persist standard ID to DB
          }
          metaComponents.push({
            type: 'HEADER',
            format: comp.format,
            example: { header_handle: [handle] },
          });
        } else {
          // Text header
          const headerComp: any = { type: 'HEADER', format: comp.format || 'TEXT' };
          if (comp.text) headerComp.text = comp.text;
          if (comp.example) headerComp.example = comp.example;
          metaComponents.push(headerComp);
        }
      } else if (type === 'BODY') {
        const bodyComp: any = { type: 'BODY', text: comp.text };
        if (comp.example) bodyComp.example = comp.example;
        metaComponents.push(bodyComp);
      } else if (type === 'FOOTER') {
        metaComponents.push({ type: 'FOOTER', text: comp.text });
      } else if (type === 'BUTTONS') {
        const buttons = (comp.buttons || []).map((btn) => {
          const b: any = { type: btn.type, text: btn.text };
          if (btn.url) b.url = btn.url;
          if (btn.phone_number) b.phone_number = btn.phone_number;
          return b;
        });
        metaComponents.push({ type: 'BUTTONS', buttons });
      }
    }
    this.logger.debug(`Meta components: ${JSON.stringify(metaComponents)}`);

    // Submit to Meta
    let metaTemplateId: string | undefined;
    try {
      const metaRes = await this.metaApi.createTemplate(
        waba.wabaId,
        waba.accessToken,
        {
          name: dto.name,
          category: dto.category,
          language: dto.language,
          components: metaComponents,
        },
      );
      metaTemplateId = metaRes.id;
    } catch (err) {
      this.logger.error('Meta template creation failed', err.message);
      throw err;
    }

    return this.templateModel.create({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      metaTemplateId,
      name: dto.name,
      category: dto.category,
      language: dto.language,
      components: dto.components as any[],
      variables: this.extractVariables(dto.components),
      status: TemplateStatus.PENDING,
    });
  }

  // ── Upload media to Meta ───────────────────────────────────────────
  async uploadMedia(orgId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Media file is required');

    const mediaLimit = TEMPLATE_MEDIA_LIMITS.find((limit) =>
      limit.matches(file.mimetype),
    );
    if (!mediaLimit) {
      throw new BadRequestException(
        'Unsupported media type. Upload JPG, PNG, MP4, PDF, DOC, or DOCX files.',
      );
    }

    if (file.size > mediaLimit.maxBytes) {
      throw new BadRequestException(
        `${mediaLimit.label} must be ${Math.floor(mediaLimit.maxBytes / (1024 * 1024))}MB or smaller.`,
      );
    }

    const waba = await this.wabaService.findDefaultForOrg(orgId);
    if (!waba) throw new BadRequestException('No active WABA found');

    try {
      const [handleResult, standardResult] = await Promise.all([
        this.metaApi.uploadTemplateMedia(
          waba.appId!,
          waba.accessToken,
          file.buffer,
          file.mimetype,
        ),
        this.metaApi.uploadMedia(
          waba.phoneNumberId,
          waba.accessToken,
          file.buffer,
          file.mimetype,
        ),
      ]);

      return { mediaId: `${handleResult.id}|||${standardResult.id}` };
    } catch (err) {
      this.logger.error('Media upload failed', err.message);
      throw err;
    }
  }

  // ── Sync all templates from Meta ───────────────────────────────────
  async syncFromMeta(
    orgId: string,
    wabaId?: string,
  ): Promise<{ synced: number; skipped: number }> {
    const waba = wabaId
      ? await this.wabaService.findOne(wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    const metaTemplates = await this.metaApi.getTemplates(
      waba.wabaId,
      waba.accessToken,
    );

    // Fetch existing templates to build lookup maps (by name and by metaTemplateId)
    const existingTemplates = await this.templateModel.find({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
    }).lean();
    const existingByName = new Map(existingTemplates.map(t => [t.name, t]));
    const existingMetaIds = new Set(
      existingTemplates.map(t => t.metaTemplateId).filter(Boolean),
    );

    let synced = 0;
    let skipped = 0;
    for (const mt of metaTemplates) {
      // Skip if this metaTemplateId is already stored under a different name entry
      // (prevents duplicate DB documents for the same Meta template)
      const alreadyExists = existingMetaIds.has(mt.id) && !existingByName.has(mt.name);
      if (alreadyExists) {
        skipped++;
        continue;
      }

      const existing = existingByName.get(mt.name);
      const components = mt.components || [];

      // Preserve mediaId from existing DB record
      if (existing && existing.components) {
        for (const comp of components) {
          if (comp.type === 'HEADER') {
            const extComp = existing.components.find((c: any) => c.type === 'HEADER');
            if (extComp && (extComp as any).mediaId) {
              (comp as any).mediaId = (extComp as any).mediaId;
            }
          }
        }
      }

      await this.templateModel.findOneAndUpdate(
        {
          organization: new Types.ObjectId(orgId),
          waba: waba._id,
          name: mt.name,
        },
        {
          $set: {
            metaTemplateId: mt.id,
            category: mt.category,
            language: mt.language,
            status: mt.status,
            components: components,
            variables: this.extractVariables(components),
            rejectedReason: mt.rejected_reason ?? null,
            qualityScore: mt.quality_score ?? null,
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
      synced++;
    }

    return { synced, skipped };
  }

  // ── Find all ───────────────────────────────────────────────────────
  async findAll(
    orgId: string,
    query: TemplateQueryDto,
  ): Promise<TemplateDocument[]> {
    const filter: any = { organization: new Types.ObjectId(orgId) };
    if (query.wabaId) filter.waba = new Types.ObjectId(query.wabaId);
    if (query.status) filter.status = query.status.toUpperCase();
    if (query.category) filter.category = query.category.toUpperCase();
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };

    return this.templateModel
      .find(filter)
      .populate('waba', 'displayPhoneNumber verifiedName')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ── Find one ───────────────────────────────────────────────────────
  async findOne(id: string, orgId: string): Promise<TemplateDocument> {
    const template = await this.templateModel
      .findOne({ _id: id, organization: new Types.ObjectId(orgId) })
      .populate('waba', 'displayPhoneNumber verifiedName')
      .exec();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  // ── Edit template (components + optional category) ─────────────────
  async update(id: string, orgId: string, dto: UpdateTemplateDto): Promise<TemplateDocument> {
    const template = await this.findOne(id, orgId);

    if (!template.metaTemplateId) {
      throw new BadRequestException('Template has no Meta ID — cannot edit on Meta');
    }

    const wabaId = (template.waba as any)._id?.toString() ?? template.waba.toString();
    const waba = await this.wabaService.findOne(wabaId);

    // Build Meta-compatible components (same logic as create)
    const metaComponents: any[] = [];
    for (const comp of dto.components) {
      const type = (comp.type || '').toUpperCase();
      if (type === 'HEADER') {
        if (comp.format && comp.format !== 'TEXT' && comp.mediaId) {
          let handle = comp.mediaId;
          let standardId = comp.mediaId;
          if (comp.mediaId.includes('|||')) {
            [handle, standardId] = comp.mediaId.split('|||');
            (comp as any).mediaId = standardId;
          }
          metaComponents.push({ type: 'HEADER', format: comp.format, example: { header_handle: [handle] } });
        } else {
          const headerComp: any = { type: 'HEADER', format: comp.format || 'TEXT' };
          if (comp.text) headerComp.text = comp.text;
          if (comp.example) headerComp.example = comp.example;
          metaComponents.push(headerComp);
        }
      } else if (type === 'BODY') {
        const bodyComp: any = { type: 'BODY', text: comp.text };
        if (comp.example) bodyComp.example = comp.example;
        metaComponents.push(bodyComp);
      } else if (type === 'FOOTER') {
        metaComponents.push({ type: 'FOOTER', text: comp.text });
      } else if (type === 'BUTTONS') {
        const buttons = (comp.buttons || []).map((btn) => {
          const b: any = { type: btn.type, text: btn.text };
          if (btn.url) b.url = btn.url;
          if (btn.phone_number) b.phone_number = btn.phone_number;
          return b;
        });
        metaComponents.push({ type: 'BUTTONS', buttons });
      }
    }

    const metaPayload: any = { components: metaComponents };
    if (dto.category) metaPayload.category = dto.category;

    try {
      await this.metaApi.updateTemplate(template.metaTemplateId, waba.accessToken, metaPayload);
    } catch (err: any) {
      this.logger.error('Meta update template failed', err.message);
      throw err;
    }

    template.components = dto.components as any[];
    template.variables = this.extractVariables(dto.components);
    if (dto.category) template.category = dto.category;
    template.status = TemplateStatus.PENDING;
    template.lastSyncedAt = new Date();
    return template.save();
  }

  // ── Delete ─────────────────────────────────────────────────────────
  async remove(id: string, orgId: string): Promise<void> {
    const template = await this.findOne(id, orgId);
    const wabaId = (template.waba as any)._id?.toString() ?? template.waba.toString();
    const waba = await this.wabaService.findOne(wabaId);

    try {
      await this.metaApi.deleteTemplate(
        waba.wabaId,
        waba.accessToken,
        template.name,
      );
    } catch (err) {
      this.logger.warn(
        `Meta delete template failed: ${err.message} — removing locally anyway`,
      );
    }

    await template.deleteOne();
  }
}
