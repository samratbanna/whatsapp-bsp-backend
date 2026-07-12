import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiKnowledgeChunkDocument = AiKnowledgeChunk & Document;

@Schema({ timestamps: true })
export class AiKnowledgeChunk {
  @Prop({ type: Types.ObjectId, ref: 'AiAgent', required: true, index: true })
  agentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AiKnowledge', required: true, index: true })
  knowledgeId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  // Vector embedding — stored as array of floats
  @Prop({ type: [Number], required: true })
  embedding: number[];

  // Which model produced this embedding
  @Prop({ required: true })
  embeddingModel: string;

  // Dimensions of the vector (1536 for OpenAI small, 768 for Gemini)
  @Prop({ required: true })
  dimensions: number;

  @Prop({ default: 0 })
  chunkIndex: number;

  @Prop({ default: 1 })
  totalChunks: number;

  // Approximate token count
  @Prop({ default: 0 })
  tokenCount: number;

  // Denormalised metadata for search result display without extra lookup
  @Prop({ type: Object })
  metadata: {
    title: string;
    type: string;
    sourceUrl?: string;
  };
}

export const AiKnowledgeChunkSchema = SchemaFactory.createForClass(AiKnowledgeChunk);

// Compound indexes for efficient per-agent and per-knowledge queries
AiKnowledgeChunkSchema.index({ agentId: 1, knowledgeId: 1 });
AiKnowledgeChunkSchema.index({ organization: 1, agentId: 1 });

/*
  Atlas Vector Search index must be created separately (Atlas UI or Admin API):

  {
    "name": "knowledge_vector_index",
    "type": "vectorSearch",
    "definition": {
      "fields": [
        {
          "type": "vector",
          "path": "embedding",
          "numDimensions": 1536,
          "similarity": "cosine"
        },
        {
          "type": "filter",
          "path": "agentId"
        }
      ]
    }
  }
*/
