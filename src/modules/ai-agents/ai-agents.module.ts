import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';

import { AiAgent, AiAgentSchema } from './schemas/ai-agent.schema';
import { AiKnowledge, AiKnowledgeSchema } from './schemas/ai-knowledge.schema';
import { AiKnowledgeChunk, AiKnowledgeChunkSchema } from './schemas/ai-knowledge-chunk.schema';
import { AiConversation, AiConversationSchema } from './schemas/ai-conversation.schema';

import { AiAgentsService } from './ai-agents.service';
import { AiAgentsController } from './ai-agents.controller';

import { AiKnowledgeService } from './ai-knowledge.service';
import { AiKnowledgeController } from './ai-knowledge.controller';

import { AiReplyService } from './ai-reply.service';
import { VectorSearchService } from './vector-search.service';

import { KnowledgeExtractorService } from './processors/knowledge-extractor.service';
import { TextChunkerService } from './processors/text-chunker.service';
import { EmbeddingService } from './processors/embedding.service';
import { AiProviderService } from './processors/ai-provider.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiAgent.name, schema: AiAgentSchema },
      { name: AiKnowledge.name, schema: AiKnowledgeSchema },
      { name: AiKnowledgeChunk.name, schema: AiKnowledgeChunkSchema },
      { name: AiConversation.name, schema: AiConversationSchema },
    ]),
    MulterModule.register({}),
  ],
  controllers: [AiAgentsController, AiKnowledgeController],
  providers: [
    AiAgentsService,
    AiKnowledgeService,
    AiReplyService,
    VectorSearchService,
    KnowledgeExtractorService,
    TextChunkerService,
    EmbeddingService,
    AiProviderService,
  ],
  exports: [AiAgentsService, AiKnowledgeService, AiReplyService, VectorSearchService],
})
export class AiAgentsModule {}
