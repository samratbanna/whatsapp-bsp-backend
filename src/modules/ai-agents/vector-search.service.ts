import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AiKnowledge, AiKnowledgeDocument, KnowledgeStatus,
} from './schemas/ai-knowledge.schema';
import {
  AiKnowledgeChunk, AiKnowledgeChunkDocument,
} from './schemas/ai-knowledge-chunk.schema';
import { AiAgent, AiAgentDocument } from './schemas/ai-agent.schema';
import { TextChunkerService } from './processors/text-chunker.service';
import { EmbeddingService } from './processors/embedding.service';

export interface SearchResult {
  content: string;
  score: number;
  knowledgeId: string;
  metadata: { title: string; type: string; sourceUrl?: string };
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    @InjectModel(AiKnowledge.name) private knowledgeModel: Model<AiKnowledgeDocument>,
    @InjectModel(AiKnowledgeChunk.name) private chunkModel: Model<AiKnowledgeChunkDocument>,
    @InjectModel(AiAgent.name) private agentModel: Model<AiAgentDocument>,
    private readonly chunker: TextChunkerService,
    private readonly embedder: EmbeddingService,
  ) {}

  // ── Build / Rebuild index for one knowledge document ──────────────────
  async buildIndex(knowledgeId: string): Promise<void> {
    const knowledge = await this.knowledgeModel
      .findById(knowledgeId)
      .exec();
    if (!knowledge || knowledge.status !== KnowledgeStatus.READY) return;
    if (!knowledge.extractedText?.trim()) return;

    // Load agent with apiKey for embeddings
    const agent = await this.agentModel
      .findById(knowledge.agentId)
      .select('+apiKey')
      .exec();
    if (!agent?.apiKey) {
      this.logger.warn(`buildIndex: no apiKey for agent ${knowledge.agentId}`);
      return;
    }

    const start = Date.now();
    this.logger.log(`Building vector index for knowledge ${knowledgeId}`);

    // Delete old chunks for this knowledge doc
    await this.chunkModel.deleteMany({ knowledgeId: new Types.ObjectId(knowledgeId) });

    // Chunk the text
    const chunks = this.chunker.chunk(knowledge.extractedText);
    if (!chunks.length) return;

    // Generate embeddings in batch
    let embeddings: number[][];
    let embeddingModel: string;
    let dimensions: number;

    try {
      const results = await this.embedder.embedBatch(
        chunks.map((c) => c.content),
        agent.provider,
        agent.apiKey,
      );
      embeddings = results.map((r) => r.embedding);
      embeddingModel = results[0].model;
      dimensions = results[0].dimensions;
    } catch (err: any) {
      this.logger.error(`Embedding failed for ${knowledgeId}: ${err?.message}`);
      return;
    }

    // Bulk insert chunks
    const docs = chunks.map((chunk, i) => ({
      agentId: knowledge.agentId,
      organization: knowledge.organization,
      knowledgeId: new Types.ObjectId(knowledgeId),
      content: chunk.content,
      embedding: embeddings[i],
      embeddingModel,
      dimensions,
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunks.length,
      tokenCount: chunk.tokenCount,
      metadata: {
        title: knowledge.title,
        type: knowledge.type,
        sourceUrl: knowledge.sourceUrl,
      },
    }));

    await this.chunkModel.insertMany(docs);

    // Update chunkCount on knowledge doc
    await this.knowledgeModel.findByIdAndUpdate(knowledgeId, {
      $set: { chunkCount: chunks.length },
    });

    this.logger.log(
      `Index built: ${knowledgeId} — ${chunks.length} chunks in ${Date.now() - start}ms`,
    );
  }

  // ── Delete chunks when knowledge is removed ───────────────────────────
  async deleteIndex(knowledgeId: string): Promise<void> {
    await this.chunkModel.deleteMany({ knowledgeId: new Types.ObjectId(knowledgeId) });
  }

  // ── Similarity search (Atlas Vector Search) ───────────────────────────
  async search(
    query: string,
    agentId: string,
    topK = 5,
    minScore = 0.6,
    trackUsage = false,
  ): Promise<SearchResult[]> {
    const agent = await this.agentModel
      .findById(agentId)
      .select('+apiKey')
      .exec();
    if (!agent?.apiKey) return [];

    let queryEmbedding: number[];
    try {
      const result = await this.embedder.embed(query, agent.provider, agent.apiKey);
      queryEmbedding = result.embedding;
    } catch (err: any) {
      this.logger.error(`Query embedding failed: ${err?.message}`);
      return [];
    }

    // Use MongoDB Atlas $vectorSearch if available, fall back to cosine in memory
    let results: SearchResult[];
    try {
      results = await this.atlasVectorSearch(queryEmbedding, agentId, topK, minScore);
    } catch (err: any) {
      // Atlas Vector Search not configured — fall back
      this.logger.warn(`Atlas vector search unavailable (${err?.message}), using in-memory fallback`);
      results = await this.inMemorySearch(queryEmbedding, agentId, topK, minScore);
    }

    // Track usage on knowledge docs (async, non-blocking)
    if (trackUsage && results.length > 0) {
      const knowledgeIds = [...new Set(results.map((r) => r.knowledgeId))];
      this.knowledgeModel
        .updateMany(
          { _id: { $in: knowledgeIds } },
          { $inc: { timesRetrieved: 1 }, $set: { lastUsedAt: new Date() } },
        )
        .catch(() => {});
    }

    return results;
  }

  // ── Atlas $vectorSearch aggregation ──────────────────────────────────
  private async atlasVectorSearch(
    queryEmbedding: number[],
    agentId: string,
    topK: number,
    minScore: number,
  ): Promise<SearchResult[]> {
    const results = await this.chunkModel.aggregate([
      {
        $vectorSearch: {
          index: 'knowledge_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter: { agentId: new Types.ObjectId(agentId) },
        },
      },
      {
        $project: {
          content: 1,
          metadata: 1,
          knowledgeId: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return results
      .filter((r: any) => r.score >= minScore)
      .map((r: any) => ({
        content: r.content,
        score: r.score,
        knowledgeId: r.knowledgeId.toString(),
        metadata: r.metadata,
      }));
  }

  // ── In-memory cosine fallback (for local dev without Atlas) ───────────
  private async inMemorySearch(
    queryEmbedding: number[],
    agentId: string,
    topK: number,
    minScore: number,
  ): Promise<SearchResult[]> {
    const chunks = await this.chunkModel
      .find({ agentId: new Types.ObjectId(agentId) })
      .select('content embedding metadata knowledgeId')
      .lean()
      .exec();

    const scored = chunks
      .map((c: any) => ({
        content: c.content as string,
        score: this.embedder.cosineSimilarity(queryEmbedding, c.embedding),
        knowledgeId: c.knowledgeId.toString(),
        metadata: c.metadata,
      }))
      .filter((c) => c.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  async getChunkStats(agentId: string) {
    const total = await this.chunkModel.countDocuments({
      agentId: new Types.ObjectId(agentId),
    });
    return { totalChunks: total };
  }

  // ── Rebuild all chunks for an agent (e.g. after agent model change) ───
  async rebuildAllForAgent(agentId: string): Promise<{ rebuilt: number; failed: number }> {
    const knowledgeDocs = await this.knowledgeModel
      .find({
        agentId: new Types.ObjectId(agentId),
        status: KnowledgeStatus.READY,
      })
      .select('_id')
      .exec();

    let rebuilt = 0;
    let failed = 0;

    for (const doc of knowledgeDocs) {
      try {
        await this.buildIndex(doc._id.toString());
        rebuilt++;
      } catch {
        failed++;
      }
    }

    return { rebuilt, failed };
  }
}
