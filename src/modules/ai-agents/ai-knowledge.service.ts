import {
  Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AiKnowledge, AiKnowledgeDocument, KnowledgeStatus, KnowledgeType,
} from './schemas/ai-knowledge.schema';
import { KnowledgeExtractorService } from './processors/knowledge-extractor.service';
import { VectorSearchService } from './vector-search.service';
import {
  CreateKnowledgeTextDto, CreateKnowledgeUrlDto, CreateKnowledgeCrawlerDto,
  CreateKnowledgeYoutubeDto, CreateKnowledgeQaPairsDto,
  CreateKnowledgeRulesDto, CreateKnowledgeProductCatalogDto, UpdateKnowledgeDto,
} from './dto/ai-knowledge.dto';

@Injectable()
export class AiKnowledgeService {
  private readonly logger = new Logger(AiKnowledgeService.name);

  constructor(
    @InjectModel(AiKnowledge.name) private knowledgeModel: Model<AiKnowledgeDocument>,
    private readonly extractor: KnowledgeExtractorService,
    @Inject(forwardRef(() => VectorSearchService))
    private readonly vectorSearch: VectorSearchService,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────
  async findAll(agentId: string, orgId: string): Promise<AiKnowledgeDocument[]> {
    return this.knowledgeModel
      .find({
        agentId: new Types.ObjectId(agentId),
        organization: new Types.ObjectId(orgId),
      })
      .select('-extractedText')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, orgId: string): Promise<AiKnowledgeDocument> {
    const doc = await this.knowledgeModel.findOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    }).exec();
    if (!doc) throw new NotFoundException('Knowledge not found');
    return doc;
  }

  // ── Text ─────────────────────────────────────────────────────────────
  async addText(
    agentId: string,
    orgId: string,
    dto: CreateKnowledgeTextDto,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();
    const text = this.extractor.extractText(dto.text);
    const stats = this.extractor.getStats(text);

    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: KnowledgeType.TEXT,
      title: dto.title,
      description: dto.description,
      language: dto.language ?? 'auto',
      extractedText: text,
      ...stats,
      processingTimeMs: Date.now() - start,
      status: KnowledgeStatus.READY,
    });

    this.vectorSearch.buildIndex(doc._id.toString()).catch((err) =>
      this.logger.error(`Vector index build failed for ${doc._id}: ${err?.message}`),
    );
    return doc;
  }

  // ── File Upload (PDF / DOCX / Excel / CSV / PPTX) ────────────────────
  async addFile(
    agentId: string,
    orgId: string,
    file: Express.Multer.File,
    title: string,
    description?: string,
    language?: string,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();
    const mime = file.mimetype;
    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();

    let knowledgeType: KnowledgeType;
    let extractedText: string;
    let filePath: string | undefined;

    if (mime === 'application/pdf' || ext === 'pdf') {
      knowledgeType = KnowledgeType.PDF;
      extractedText = await this.extractor.extractPdf(file.buffer);
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      knowledgeType = KnowledgeType.DOCX;
      extractedText = await this.extractor.extractDocx(file.buffer);
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel' ||
      ext === 'xlsx' || ext === 'xls'
    ) {
      knowledgeType = KnowledgeType.EXCEL;
      extractedText = this.extractor.extractExcel(file.buffer);
    } else if (mime === 'text/csv' || ext === 'csv') {
      knowledgeType = KnowledgeType.CSV;
      extractedText = this.extractor.extractCsv(file.buffer);
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      ext === 'pptx'
    ) {
      knowledgeType = KnowledgeType.PPTX;
      filePath = this.extractor.saveFileToDisk(file.buffer, file.originalname);
      try {
        extractedText = await this.extractor.extractPptx(file.buffer, filePath);
      } finally {
        this.extractor.deleteFile(filePath!);
        filePath = undefined;
      }
    } else {
      throw new BadRequestException(
        `Unsupported file type: ${ext}. Supported: pdf, docx, xlsx, xls, csv, pptx`,
      );
    }

    const stats = this.extractor.getStats(extractedText);

    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: knowledgeType,
      title: title || file.originalname,
      description,
      language: language ?? 'auto',
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: mime,
      extractedText,
      ...stats,
      processingTimeMs: Date.now() - start,
      status: KnowledgeStatus.READY,
    });

    this.vectorSearch.buildIndex(doc._id.toString()).catch((err) =>
      this.logger.error(`Vector index build failed for ${doc._id}: ${err?.message}`),
    );
    return doc;
  }

  // ── Website (single page) ─────────────────────────────────────────────
  async addWebsite(
    agentId: string,
    orgId: string,
    dto: CreateKnowledgeUrlDto,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();

    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: KnowledgeType.WEBSITE,
      title: dto.title,
      description: dto.description,
      sourceUrl: dto.url,
      language: dto.language ?? 'auto',
      status: KnowledgeStatus.PROCESSING,
    });

    // Process async (fire-and-forget, update when done)
    this.processWebsite(doc._id.toString(), dto.url, start).catch((err) => {
      this.logger.error(`Website processing failed for ${doc._id}: ${err?.message}`);
    });

    return doc;
  }

  private async processWebsite(docId: string, url: string, start: number): Promise<void> {
    try {
      const text = await this.extractor.extractWebsite(url);
      const stats = this.extractor.getStats(text);
      await this.knowledgeModel.findByIdAndUpdate(docId, {
        $set: {
          extractedText: text,
          ...stats,
          processingTimeMs: Date.now() - start,
          status: KnowledgeStatus.READY,
          lastSyncedAt: new Date(),
        },
      });
      this.logger.log(`Website extracted: ${docId} (${stats.wordCount} words)`);
      this.vectorSearch.buildIndex(docId).catch((err) =>
        this.logger.error(`Vector index build failed for ${docId}: ${err?.message}`),
      );
    } catch (err: any) {
      await this.knowledgeModel.findByIdAndUpdate(docId, {
        $set: { status: KnowledgeStatus.FAILED, errorMessage: err?.message },
      });
    }
  }

  // ── Website Crawler ────────────────────────────────────────────────────
  async addCrawler(
    agentId: string,
    orgId: string,
    dto: CreateKnowledgeCrawlerDto,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();

    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: KnowledgeType.WEBSITE_CRAWLER,
      title: dto.title,
      description: dto.description,
      sourceUrl: dto.startUrl,
      language: dto.language ?? 'auto',
      crawlerConfig: dto.config ?? {},
      autoSync: dto.autoSync ?? false,
      syncInterval: dto.syncInterval ?? 'manual',
      status: KnowledgeStatus.PROCESSING,
    });

    this.processCrawler(doc._id.toString(), dto.startUrl, dto.config ?? {}, start).catch(
      (err) => this.logger.error(`Crawler failed for ${doc._id}: ${err?.message}`),
    );

    return doc;
  }

  private async processCrawler(
    docId: string,
    startUrl: string,
    config: any,
    start: number,
  ): Promise<void> {
    try {
      const result = await this.extractor.crawlWebsite(startUrl, config);
      const stats = this.extractor.getStats(result.text);
      await this.knowledgeModel.findByIdAndUpdate(docId, {
        $set: {
          extractedText: result.text,
          ...stats,
          processingTimeMs: Date.now() - start,
          'crawlerConfig.crawledPages': result.pageCount,
          'crawlerConfig.crawledUrls': result.crawledUrls,
          status: KnowledgeStatus.READY,
          lastSyncedAt: new Date(),
        },
      });
      this.logger.log(`Crawler done: ${docId} — ${result.pageCount} pages, ${stats.wordCount} words`);
      this.vectorSearch.buildIndex(docId).catch((err) =>
        this.logger.error(`Vector index build failed for ${docId}: ${err?.message}`),
      );
    } catch (err: any) {
      await this.knowledgeModel.findByIdAndUpdate(docId, {
        $set: { status: KnowledgeStatus.FAILED, errorMessage: err?.message },
      });
    }
  }

  // ── YouTube ────────────────────────────────────────────────────────────
  async addYoutube(
    agentId: string,
    orgId: string,
    dto: CreateKnowledgeYoutubeDto,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();

    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: KnowledgeType.YOUTUBE,
      title: dto.title,
      description: dto.description,
      sourceUrl: dto.youtubeUrl,
      language: dto.language ?? 'auto',
      status: KnowledgeStatus.PROCESSING,
    });

    this.processYoutube(doc._id.toString(), dto.youtubeUrl, start).catch(
      (err) => this.logger.error(`YouTube failed for ${doc._id}: ${err?.message}`),
    );

    return doc;
  }

  private async processYoutube(docId: string, url: string, start: number): Promise<void> {
    try {
      const text = await this.extractor.extractYoutube(url);
      const stats = this.extractor.getStats(text);
      await this.knowledgeModel.findByIdAndUpdate(docId, {
        $set: {
          extractedText: text,
          ...stats,
          processingTimeMs: Date.now() - start,
          status: KnowledgeStatus.READY,
        },
      });
      this.vectorSearch.buildIndex(docId).catch((err) =>
        this.logger.error(`Vector index build failed for ${docId}: ${err?.message}`),
      );
    } catch (err: any) {
      await this.knowledgeModel.findByIdAndUpdate(docId, {
        $set: { status: KnowledgeStatus.FAILED, errorMessage: err?.message },
      });
    }
  }

  // ── Structured types ───────────────────────────────────────────────────
  async addQaPairs(
    agentId: string,
    orgId: string,
    dto: CreateKnowledgeQaPairsDto,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();
    const text = this.extractor.extractQaPairs(dto.pairs);
    const stats = this.extractor.getStats(text);
    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: KnowledgeType.QA_PAIRS,
      title: dto.title,
      description: dto.description,
      extractedText: text,
      ...stats,
      processingTimeMs: Date.now() - start,
      status: KnowledgeStatus.READY,
    });
    this.vectorSearch.buildIndex(doc._id.toString()).catch(() => {});
    return doc;
  }

  async addRules(
    agentId: string,
    orgId: string,
    dto: CreateKnowledgeRulesDto,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();
    const text = this.extractor.extractRules(dto.rules);
    const stats = this.extractor.getStats(text);
    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: KnowledgeType.RULES,
      title: dto.title,
      description: dto.description,
      extractedText: text,
      ...stats,
      processingTimeMs: Date.now() - start,
      status: KnowledgeStatus.READY,
    });
    this.vectorSearch.buildIndex(doc._id.toString()).catch(() => {});
    return doc;
  }

  async addProductCatalog(
    agentId: string,
    orgId: string,
    dto: CreateKnowledgeProductCatalogDto,
  ): Promise<AiKnowledgeDocument> {
    const start = Date.now();
    const text = this.extractor.extractProductCatalog(dto.products);
    const stats = this.extractor.getStats(text);
    const doc = await this.knowledgeModel.create({
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
      type: KnowledgeType.PRODUCT_CATALOG,
      title: dto.title,
      description: dto.description,
      extractedText: text,
      ...stats,
      processingTimeMs: Date.now() - start,
      status: KnowledgeStatus.READY,
    });
    this.vectorSearch.buildIndex(doc._id.toString()).catch(() => {});
    return doc;
  }

  // ── Update ─────────────────────────────────────────────────────────────
  async update(id: string, orgId: string, dto: UpdateKnowledgeDto): Promise<AiKnowledgeDocument> {
    const doc = await this.knowledgeModel.findOneAndUpdate(
      { _id: id, organization: new Types.ObjectId(orgId) },
      { $set: dto },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundException('Knowledge not found');
    return doc;
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async remove(id: string, orgId: string): Promise<void> {
    const doc = await this.knowledgeModel.findOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (!doc) throw new NotFoundException('Knowledge not found');
    if (doc.filePath) this.extractor.deleteFile(doc.filePath);
    await doc.deleteOne();
    // Delete associated vector chunks
    this.vectorSearch.deleteIndex(id).catch(() => {});
  }

  // ── Retrigger processing (for FAILED / OUTDATED) ──────────────────────
  async retrigger(id: string, orgId: string): Promise<AiKnowledgeDocument> {
    const doc = await this.findOne(id, orgId);
    if (doc.status === KnowledgeStatus.PROCESSING) {
      throw new BadRequestException('Already processing');
    }

    await this.knowledgeModel.findByIdAndUpdate(id, {
      $set: { status: KnowledgeStatus.PROCESSING, errorMessage: undefined },
    });

    const start = Date.now();
    if (doc.type === KnowledgeType.WEBSITE && doc.sourceUrl) {
      this.processWebsite(id, doc.sourceUrl, start).catch(() => {});
    } else if (doc.type === KnowledgeType.WEBSITE_CRAWLER && doc.sourceUrl) {
      this.processCrawler(id, doc.sourceUrl, doc.crawlerConfig ?? {}, start).catch(() => {});
    } else if (doc.type === KnowledgeType.YOUTUBE && doc.sourceUrl) {
      this.processYoutube(id, doc.sourceUrl, start).catch(() => {});
    } else {
      throw new BadRequestException('Cannot retrigger this knowledge type');
    }

    return this.knowledgeModel.findById(id).exec() as Promise<AiKnowledgeDocument>;
  }

  // ── Used by AI service to fetch context ───────────────────────────────
  async getReadyKnowledgeForAgent(agentId: string): Promise<AiKnowledgeDocument[]> {
    return this.knowledgeModel
      .find({
        agentId: new Types.ObjectId(agentId),
        status: KnowledgeStatus.READY,
      })
      .select('extractedText title type wordCount')
      .exec();
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  async getStats(agentId: string, orgId: string) {
    const docs = await this.knowledgeModel
      .find({
        agentId: new Types.ObjectId(agentId),
        organization: new Types.ObjectId(orgId),
      })
      .select('status wordCount type')
      .exec();

    const total = docs.length;
    const ready = docs.filter((d) => d.status === KnowledgeStatus.READY).length;
    const failed = docs.filter((d) => d.status === KnowledgeStatus.FAILED).length;
    const totalWords = docs.reduce((sum, d) => sum + (d.wordCount ?? 0), 0);

    const byType: Record<string, number> = {};
    for (const d of docs) {
      byType[d.type] = (byType[d.type] ?? 0) + 1;
    }

    return { total, ready, failed, totalWords, byType };
  }

  // ── Knowledge usage analytics ─────────────────────────────────────────
  async getUsageAnalytics(agentId: string, orgId: string) {
    const docs = await this.knowledgeModel
      .find({
        agentId: new Types.ObjectId(agentId),
        organization: new Types.ObjectId(orgId),
        status: KnowledgeStatus.READY,
      })
      .select('title type timesRetrieved lastUsedAt wordCount chunkCount createdAt')
      .sort({ timesRetrieved: -1 })
      .exec();

    const totalRetrievals = docs.reduce((sum, d) => sum + (d.timesRetrieved ?? 0), 0);
    const neverUsed = docs.filter((d) => !d.timesRetrieved).length;
    const topUsed = docs.slice(0, 5).map((d) => ({
      id: d._id,
      title: d.title,
      type: d.type,
      timesRetrieved: d.timesRetrieved,
      lastUsedAt: d.lastUsedAt,
      wordCount: d.wordCount,
      chunkCount: d.chunkCount,
    }));

    return {
      totalDocs: docs.length,
      totalRetrievals,
      neverUsed,
      topUsed,
      all: docs.map((d) => ({
        id: d._id,
        title: d.title,
        type: d.type,
        timesRetrieved: d.timesRetrieved ?? 0,
        lastUsedAt: d.lastUsedAt,
        wordCount: d.wordCount,
        chunkCount: d.chunkCount,
        createdAt: (d as any).createdAt,
      })),
    };
  }
}
