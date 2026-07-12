import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiAgentDocument = AiAgent & Document;

export enum AiProvider {
  OPENAI    = 'openai',
  GEMINI    = 'gemini',
  DEEPSEEK  = 'deepseek',
}

export enum AiAgentStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
}

export enum HandoffReason {
  MAX_TURNS    = 'max_turns',
  KEYWORD      = 'keyword',
  CANT_ANSWER  = 'cant_answer',
  MANUAL       = 'manual',
}

@Schema({ timestamps: true })
export class AiAgent {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  // Optional — if set, this agent is the default for that WABA
  @Prop({ type: Types.ObjectId, ref: 'Waba', default: null })
  waba?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  // ── AI Provider config ──────────────────────────────────────────────
  @Prop({ enum: AiProvider, required: true })
  provider: AiProvider;

  @Prop({ required: true })
  model: string; // e.g. gpt-4o, gemini-2.0-flash, deepseek-chat

  @Prop({ required: true, select: false }) // never return apiKey in lists
  apiKey: string;

  // ── Personality ─────────────────────────────────────────────────────
  @Prop({ default: 'You are a helpful assistant.' })
  systemPrompt: string;

  // Hard rules always injected — "Always say X", "Never mention Y"
  @Prop({ type: [String], default: [] })
  hardRules: string[];

  // ── Response config ─────────────────────────────────────────────────
  @Prop({ default: 0.7 })
  temperature: number; // 0.0 - 1.0

  @Prop({ default: 500 })
  maxTokens: number;

  // How many past conversation turns to include (each turn = 1 user + 1 AI msg)
  @Prop({ default: 10 })
  maxHistoryTurns: number;

  // ── Human Handoff config ────────────────────────────────────────────
  @Prop({ default: 50 })
  maxTurnsBeforeHandoff: number; // vendor sets this

  @Prop({ type: [String], default: ['human', 'agent', 'support', 'help me'] })
  handoffKeywords: string[];

  // Message sent to user just before handoff
  @Prop({ default: 'Connecting you to our support team. Please wait...' })
  handoffMessage: string;

  // Message sent when AI cannot answer
  @Prop({ default: "I'm not sure about this. Let me connect you with our team." })
  cantAnswerMessage: string;

  // Similarity threshold below which AI considers itself unable to answer
  @Prop({ default: 0.65 })
  confidenceThreshold: number;

  // ── Citation ────────────────────────────────────────────────────────
  @Prop({ default: false })
  showCitations: boolean; // "According to [source]: ..."

  // ── Flags ───────────────────────────────────────────────────────────
  @Prop({ default: false })
  isDefault: boolean; // default agent for the org/waba

  @Prop({ enum: AiAgentStatus, default: AiAgentStatus.ACTIVE })
  status: AiAgentStatus;

  // ── Stats (updated by system) ───────────────────────────────────────
  @Prop({ default: 0 })
  totalConversations: number;

  @Prop({ default: 0 })
  totalReplies: number;

  @Prop({ default: 0 })
  totalHandoffs: number;
}

export const AiAgentSchema = SchemaFactory.createForClass(AiAgent);
AiAgentSchema.index({ organization: 1, status: 1 });
AiAgentSchema.index({ organization: 1, isDefault: 1 });
