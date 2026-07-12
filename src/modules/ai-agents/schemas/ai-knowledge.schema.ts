import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiKnowledgeDocument = AiKnowledge & Document;

export enum KnowledgeType {
  TEXT             = 'text',
  PDF              = 'pdf',
  DOCX             = 'docx',
  EXCEL            = 'excel',
  CSV              = 'csv',
  PPTX             = 'pptx',
  WEBSITE          = 'website',
  WEBSITE_CRAWLER  = 'website_crawler',
  YOUTUBE          = 'youtube',
  AUDIO            = 'audio',
  VIDEO            = 'video',
  IMAGE            = 'image',
  QA_PAIRS         = 'qa_pairs',
  RULES            = 'rules',
  PRODUCT_CATALOG  = 'product_catalog',
}

export enum KnowledgeStatus {
  PENDING    = 'pending',
  PROCESSING = 'processing',
  READY      = 'ready',
  FAILED     = 'failed',
  OUTDATED   = 'outdated', // auto-sync detected changes
}

@Schema({ timestamps: true })
export class AiKnowledge {
  @Prop({ type: Types.ObjectId, ref: 'AiAgent', required: true, index: true })
  agentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ enum: KnowledgeType, required: true })
  type: KnowledgeType;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  // ── Extracted content (stored separately — can be large) ────────────
  @Prop({ default: '' })
  extractedText: string;

  // ── File info (for uploaded files) ──────────────────────────────────
  @Prop()
  fileName?: string;

  @Prop()
  fileSize?: number; // bytes

  @Prop()
  mimeType?: string;

  @Prop()
  filePath?: string; // local disk path

  // ── Source info (for web/youtube) ───────────────────────────────────
  @Prop()
  sourceUrl?: string;

  // Crawler-specific config
  @Prop({ type: Object })
  crawlerConfig?: {
    maxPages?: number;       // default: 50
    maxDepth?: number;       // default: 3
    includePaths?: string[]; // only crawl these paths
    excludePaths?: string[]; // skip these paths
    followSitemap?: boolean;
    respectRobotsTxt?: boolean;
    crawledPages?: number;   // how many pages actually crawled
    crawledUrls?: string[];  // list of crawled URLs
  };

  // Auto-sync for websites
  @Prop({ default: false })
  autoSync: boolean;

  @Prop({ enum: ['1d', '7d', '30d', 'manual'], default: 'manual' })
  syncInterval: string;

  @Prop()
  lastSyncedAt?: Date;

  // ── Processing stats ─────────────────────────────────────────────────
  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ default: 0 })
  charCount: number;

  @Prop({ default: 0 })
  chunkCount: number;

  @Prop({ default: 0 })
  processingTimeMs: number;

  // ── Language ──────────────────────────────────────────────────────────
  @Prop({ default: 'auto' })
  language: string;

  // ── Status ────────────────────────────────────────────────────────────
  @Prop({ enum: KnowledgeStatus, default: KnowledgeStatus.PENDING })
  status: KnowledgeStatus;

  @Prop()
  errorMessage?: string;

  // ── Usage analytics ────────────────────────────────────────────────
  @Prop({ default: 0 })
  timesRetrieved: number;

  @Prop()
  lastUsedAt?: Date;
}

export const AiKnowledgeSchema = SchemaFactory.createForClass(AiKnowledge);
AiKnowledgeSchema.index({ agentId: 1, status: 1 });
AiKnowledgeSchema.index({ organization: 1, agentId: 1 });
