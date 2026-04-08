import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Template, TemplateDocument, TemplateStatus } from './schemas/template.schema';
import { CreateTemplateDto, TemplateQueryDto } from './dto/template.dto';
import { WabaService } from '../waba/waba.service';
import { MetaApiService } from '../../common/services/meta-api.service';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
    private wabaService: WabaService,
    private metaApi: MetaApiService,
  ) {}

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
  async create(orgId: string, dto: CreateTemplateDto): Promise<TemplateDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    const existing = await this.templateModel.findOne({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      name: dto.name,
    });
    if (existing) throw new BadRequestException('Template with this name already exists');

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
          components: dto.components,
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

  // ── Sync all templates from Meta ───────────────────────────────────
  async syncFromMeta(orgId: string, wabaId?: string): Promise<{ synced: number }> {
    const waba = wabaId
      ? await this.wabaService.findOne(wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);

    if (!waba) throw new BadRequestException('No active WABA found');

    const metaTemplates = await this.metaApi.getTemplates(
      waba.wabaId,
      waba.accessToken,
    );

    let synced = 0;
    for (const mt of metaTemplates) {
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
            components: mt.components || [],
            variables: this.extractVariables(mt.components || []),
            rejectedReason: mt.rejected_reason,
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
      synced++;
    }

    return { synced };
  }

  // ── Find all ───────────────────────────────────────────────────────
  async findAll(orgId: string, query: TemplateQueryDto): Promise<TemplateDocument[]> {
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

  // ── Delete ─────────────────────────────────────────────────────────
  async remove(id: string, orgId: string): Promise<void> {
    const template = await this.findOne(id, orgId);
    const waba = await this.wabaService.findOne(
      template.waba.toString(),
      orgId,
    );

    try {
      await this.metaApi.deleteTemplate(waba.wabaId, waba.accessToken, template.name);
    } catch (err) {
      this.logger.warn(`Meta delete template failed: ${err.message} — removing locally anyway`);
    }

    await template.deleteOne();
  }
}
