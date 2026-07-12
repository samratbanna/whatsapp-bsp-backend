import { Injectable, Logger } from '@nestjs/common';
import { AiProvider } from '../schemas/ai-agent.schema';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

// Default embedding models per provider
const DEFAULT_EMBEDDING_MODEL: Record<AiProvider, string> = {
  [AiProvider.OPENAI]:   'text-embedding-3-small',   // 1536 dims
  [AiProvider.GEMINI]:   'text-embedding-004',        // 768 dims
  [AiProvider.DEEPSEEK]: 'text-embedding-3-small',   // DeepSeek has no embedding — fall back to OpenAI model
};

const EMBEDDING_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small':   1536,
  'text-embedding-3-large':   3072,
  'text-embedding-ada-002':   1536,
  'text-embedding-004':        768,
};

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  async embed(
    text: string,
    provider: AiProvider,
    apiKey: string,
    modelOverride?: string,
  ): Promise<EmbeddingResult> {
    const model = modelOverride ?? DEFAULT_EMBEDDING_MODEL[provider];

    if (provider === AiProvider.GEMINI) {
      return this.embedWithGemini(text, apiKey, model);
    }
    // OpenAI and DeepSeek both use OpenAI-compatible API
    return this.embedWithOpenAI(text, apiKey, model, provider);
  }

  async embedBatch(
    texts: string[],
    provider: AiProvider,
    apiKey: string,
    modelOverride?: string,
  ): Promise<EmbeddingResult[]> {
    const model = modelOverride ?? DEFAULT_EMBEDDING_MODEL[provider];

    if (provider === AiProvider.GEMINI) {
      // Gemini doesn't support batch in one call — fan out sequentially
      const results: EmbeddingResult[] = [];
      for (const text of texts) {
        results.push(await this.embedWithGemini(text, apiKey, model));
      }
      return results;
    }
    return this.embedBatchWithOpenAI(texts, apiKey, model, provider);
  }

  // ── OpenAI / DeepSeek ─────────────────────────────────────────────────
  private async embedWithOpenAI(
    text: string,
    apiKey: string,
    model: string,
    provider: AiProvider,
  ): Promise<EmbeddingResult> {
    const OpenAI = require('openai');
    const baseURL =
      provider === AiProvider.DEEPSEEK
        ? 'https://api.deepseek.com/v1'
        : undefined;

    const client = new OpenAI.default({ apiKey, ...(baseURL ? { baseURL } : {}) });
    const response = await client.embeddings.create({ model, input: text });
    const embedding = response.data[0].embedding as number[];
    return {
      embedding,
      model,
      dimensions: embedding.length,
    };
  }

  private async embedBatchWithOpenAI(
    texts: string[],
    apiKey: string,
    model: string,
    provider: AiProvider,
  ): Promise<EmbeddingResult[]> {
    const OpenAI = require('openai');
    const baseURL =
      provider === AiProvider.DEEPSEEK
        ? 'https://api.deepseek.com/v1'
        : undefined;

    const client = new OpenAI.default({ apiKey, ...(baseURL ? { baseURL } : {}) });

    // OpenAI accepts up to 2048 inputs per call — chunk at 100 for safety
    const BATCH_SIZE = 100;
    const allResults: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const response = await client.embeddings.create({ model, input: batch });
      for (const item of response.data) {
        allResults.push({
          embedding: item.embedding as number[],
          model,
          dimensions: item.embedding.length,
        });
      }
    }
    return allResults;
  }

  // ── Google Gemini ─────────────────────────────────────────────────────
  private async embedWithGemini(
    text: string,
    apiKey: string,
    model: string,
  ): Promise<EmbeddingResult> {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genai = new GoogleGenerativeAI(apiKey);
    const embedModel = genai.getGenerativeModel({ model });
    const result = await embedModel.embedContent(text);
    const embedding: number[] = result.embedding.values;
    return {
      embedding,
      model,
      dimensions: embedding.length,
    };
  }

  // ── Cosine similarity (for local reranking) ───────────────────────────
  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getDimensions(provider: AiProvider, modelOverride?: string): number {
    const model = modelOverride ?? DEFAULT_EMBEDDING_MODEL[provider];
    return EMBEDDING_DIMENSIONS[model] ?? 1536;
  }
}
