import { Injectable, Logger } from '@nestjs/common';
import { AiProvider } from '../schemas/ai-agent.schema';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  async chat(
    messages: ChatMessage[],
    provider: AiProvider,
    model: string,
    apiKey: string,
    options: ChatOptions = {},
  ): Promise<ChatResponse> {
    switch (provider) {
      case AiProvider.OPENAI:
        return this.chatOpenAI(messages, model, apiKey, options);
      case AiProvider.DEEPSEEK:
        return this.chatDeepSeek(messages, model, apiKey, options);
      case AiProvider.GEMINI:
        return this.chatGemini(messages, model, apiKey, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // ── OpenAI ────────────────────────────────────────────────────────────
  private async chatOpenAI(
    messages: ChatMessage[],
    model: string,
    apiKey: string,
    options: ChatOptions,
  ): Promise<ChatResponse> {
    const OpenAI = require('openai');
    const client = new OpenAI.default({ apiKey });

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 500,
    });

    return {
      text: response.choices[0]?.message?.content?.trim() ?? '',
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    };
  }

  // ── DeepSeek (OpenAI-compatible) ──────────────────────────────────────
  private async chatDeepSeek(
    messages: ChatMessage[],
    model: string,
    apiKey: string,
    options: ChatOptions,
  ): Promise<ChatResponse> {
    const OpenAI = require('openai');
    const client = new OpenAI.default({
      apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    });

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 500,
    });

    return {
      text: response.choices[0]?.message?.content?.trim() ?? '',
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    };
  }

  // ── Google Gemini ─────────────────────────────────────────────────────
  private async chatGemini(
    messages: ChatMessage[],
    model: string,
    apiKey: string,
    options: ChatOptions,
  ): Promise<ChatResponse> {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genai = new GoogleGenerativeAI(apiKey);

    const geminiModel = genai.getGenerativeModel({
      model,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 500,
      },
    });

    // Gemini separates system instruction from history
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    // Convert to Gemini history format (all but last message)
    const history = chatMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = chatMessages[chatMessages.length - 1];
    if (!lastMessage) return { text: '' };

    // Inject system prompt into first user message if no dedicated system role
    const systemText = systemMsg?.content ? `${systemMsg.content}\n\n` : '';
    const userText =
      history.length === 0
        ? `${systemText}${lastMessage.content}`
        : lastMessage.content;

    const chat = geminiModel.startChat({
      history,
      ...(systemMsg && history.length > 0
        ? { systemInstruction: { parts: [{ text: systemMsg.content }] } }
        : {}),
    });

    const result = await chat.sendMessage(userText);
    const text = result.response.text().trim();

    return {
      text,
      outputTokens: result.response.usageMetadata?.candidatesTokenCount,
      inputTokens: result.response.usageMetadata?.promptTokenCount,
    };
  }
}
