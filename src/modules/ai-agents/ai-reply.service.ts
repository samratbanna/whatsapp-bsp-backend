import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AiConversation, AiConversationDocument, AiConversationStatus,
} from './schemas/ai-conversation.schema';
import { AiAgentDocument, HandoffReason } from './schemas/ai-agent.schema';
import { AiAgentsService } from './ai-agents.service';
import { VectorSearchService, SearchResult } from './vector-search.service';
import { AiProviderService, ChatMessage } from './processors/ai-provider.service';

export interface AiReplyResult {
  reply: string | null;          // null means skip (human is handling or agent inactive)
  handoff: boolean;
  handoffReason?: HandoffReason;
  conversationId: string;
}

@Injectable()
export class AiReplyService {
  private readonly logger = new Logger(AiReplyService.name);

  constructor(
    @InjectModel(AiConversation.name)
    private conversationModel: Model<AiConversationDocument>,
    private readonly agentsService: AiAgentsService,
    private readonly vectorSearch: VectorSearchService,
    private readonly aiProvider: AiProviderService,
  ) {}

  // ── Main entry point — called by webhook after flow check ────────────
  async processMessage(params: {
    phone: string;
    text: string;
    orgId: string;
    wabaId?: string;
    agentId?: string;   // explicit agent override (used by flow AI_AGENT node)
  }): Promise<AiReplyResult | null> {
    const { phone, text, orgId, wabaId, agentId: agentIdOverride } = params;

    // Find agent: use explicit override, or find the default
    let agent: AiAgentDocument | null;
    if (agentIdOverride) {
      agent = await this.agentsService.findOneWithKey(agentIdOverride);
    } else {
      agent = await this.agentsService.findDefault(orgId, wabaId);
    }
    if (!agent) return null;

    const agentId = agent._id.toString();

    // Load or create conversation
    const conversation = await this.getOrCreateConversation(phone, agentId, orgId, wabaId);

    // If human has taken over, don't reply
    if (conversation.status === AiConversationStatus.HANDED_OFF) {
      return { reply: null, handoff: false, conversationId: conversation._id.toString() };
    }

    // Check handoff keywords in user message
    const triggersHandoff = this.checkHandoffKeywords(text, agent.handoffKeywords ?? []);
    if (triggersHandoff) {
      await this.triggerHandoff(conversation, HandoffReason.KEYWORD);
      await this.agentsService.incrementStats(agentId, 'totalHandoffs');
      return {
        reply: agent.handoffMessage,
        handoff: true,
        handoffReason: HandoffReason.KEYWORD,
        conversationId: conversation._id.toString(),
      };
    }

    // Add user message to history
    await this.addMessage(conversation, 'user', text);

    // Vector search for relevant knowledge (track usage for real conversations)
    const chunks = await this.vectorSearch.search(
      text,
      agentId,
      5,
      agent.confidenceThreshold ?? 0.65,
      true,
    );

    // If no relevant knowledge found, send cantAnswerMessage and maybe handoff
    if (chunks.length === 0 && agent.cantAnswerMessage) {
      const cantAnswer = agent.cantAnswerMessage;
      await this.addMessage(conversation, 'assistant', cantAnswer);
      await this.updateTurnCount(conversation);

      const shouldHandoff = conversation.turnCount + 1 >= (agent.maxTurnsBeforeHandoff ?? 50);
      if (shouldHandoff) {
        await this.triggerHandoff(conversation, HandoffReason.CANT_ANSWER);
        await this.agentsService.incrementStats(agentId, 'totalHandoffs');
      }

      await this.agentsService.incrementStats(agentId, 'totalReplies');
      return {
        reply: cantAnswer,
        handoff: shouldHandoff,
        handoffReason: shouldHandoff ? HandoffReason.CANT_ANSWER : undefined,
        conversationId: conversation._id.toString(),
      };
    }

    // Build AI messages
    const aiMessages = this.buildMessages(agent, conversation, text, chunks);

    // Call AI provider
    let aiReply: string;
    try {
      const response = await this.aiProvider.chat(
        aiMessages,
        agent.provider,
        agent.model,
        (agent as any).apiKey,
        { temperature: agent.temperature, maxTokens: agent.maxTokens },
      );
      aiReply = response.text;
    } catch (err: any) {
      this.logger.error(`AI call failed for agent ${agentId}: ${err?.message}`);
      return null;
    }

    if (!aiReply) return null;

    // Append citations if enabled
    if (agent.showCitations && chunks.length > 0) {
      const sources = [...new Set(chunks.map((c) => c.metadata?.title).filter(Boolean))];
      aiReply = `${aiReply}\n\n_Sources: ${sources.join(', ')}_`;
    }

    // Save assistant reply
    await this.addMessage(conversation, 'assistant', aiReply);
    await this.updateTurnCount(conversation);
    await this.agentsService.incrementStats(agentId, 'totalReplies');

    // Check if max turns reached
    const newTurnCount = conversation.turnCount + 1;
    if (newTurnCount >= (agent.maxTurnsBeforeHandoff ?? 50)) {
      await this.triggerHandoff(conversation, HandoffReason.MAX_TURNS);
      await this.agentsService.incrementStats(agentId, 'totalHandoffs');

      const fullReply = `${aiReply}\n\n${agent.handoffMessage}`;
      return {
        reply: fullReply,
        handoff: true,
        handoffReason: HandoffReason.MAX_TURNS,
        conversationId: conversation._id.toString(),
      };
    }

    return {
      reply: aiReply,
      handoff: false,
      conversationId: conversation._id.toString(),
    };
  }

  // ── Build prompt messages ────────────────────────────────────────────
  private buildMessages(
    agent: AiAgentDocument,
    conversation: AiConversationDocument,
    userText: string,
    chunks: SearchResult[],
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // System prompt
    let systemContent = agent.systemPrompt ?? 'You are a helpful assistant.';

    // Hard rules
    if (agent.hardRules?.length) {
      systemContent += '\n\nIMPORTANT RULES:\n' + agent.hardRules.map((r, i) => `${i + 1}. ${r}`).join('\n');
    }

    // Knowledge context
    if (chunks.length > 0) {
      const context = chunks
        .map((c) => `[${c.metadata?.title ?? 'Knowledge'}]\n${c.content}`)
        .join('\n\n---\n\n');
      systemContent += `\n\nUse the following knowledge to answer the user. Only use information from this context:\n\n${context}`;
    }

    messages.push({ role: 'system', content: systemContent });

    // Conversation history (last N turns, trimmed)
    const historyTurns = agent.maxHistoryTurns ?? 10;
    const historyMessages = conversation.messages.slice(-(historyTurns * 2));

    // Exclude the last user message we just added (it will be the final message)
    const priorMessages = historyMessages.slice(0, -1);
    for (const msg of priorMessages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Current user message
    messages.push({ role: 'user', content: userText });

    return messages;
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  private async getOrCreateConversation(
    phone: string,
    agentId: string,
    orgId: string,
    wabaId?: string,
  ): Promise<AiConversationDocument> {
    let conv = await this.conversationModel
      .findOne({ agentId: new Types.ObjectId(agentId), phone })
      .exec();

    if (!conv) {
      conv = await this.conversationModel.create({
        organization: new Types.ObjectId(orgId),
        agentId: new Types.ObjectId(agentId),
        phone,
        ...(wabaId ? { wabaId: new Types.ObjectId(wabaId) } : {}),
        messages: [],
        turnCount: 0,
        status: AiConversationStatus.ACTIVE,
        lastMessageAt: new Date(),
      });
      // Count new conversation
      await this.agentsService.incrementStats(agentId, 'totalConversations');
    }

    return conv;
  }

  private async addMessage(
    conversation: AiConversationDocument,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      $push: { messages: { role, content, timestamp: new Date() } },
      $set: { lastMessageAt: new Date() },
    });
  }

  private async updateTurnCount(conversation: AiConversationDocument): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      $inc: { turnCount: 1 },
    });
  }

  private async triggerHandoff(
    conversation: AiConversationDocument,
    reason: HandoffReason,
  ): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      $set: {
        status: AiConversationStatus.HANDED_OFF,
        handoffReason: reason,
        lastMessageAt: new Date(),
      },
    });
    this.logger.log(`Handoff triggered for phone=${conversation.phone} reason=${reason}`);
  }

  private checkHandoffKeywords(text: string, keywords: string[]): boolean {
    if (!keywords.length) return false;
    const lower = text.toLowerCase();
    return keywords.some((k) => lower.includes(k.toLowerCase()));
  }

  // ── Resolve handoff (called when human marks conversation as resolved) ─
  async resolveConversation(conversationId: string, orgId: string): Promise<void> {
    await this.conversationModel.findOneAndUpdate(
      { _id: conversationId, organization: new Types.ObjectId(orgId) },
      { $set: { status: AiConversationStatus.RESOLVED } },
    );
  }

  // Re-activate AI for a resolved conversation
  async reactivate(conversationId: string, orgId: string): Promise<void> {
    await this.conversationModel.findOneAndUpdate(
      { _id: conversationId, organization: new Types.ObjectId(orgId) },
      { $set: { status: AiConversationStatus.ACTIVE, handoffReason: undefined } },
    );
  }

  // ── Dashboard queries ─────────────────────────────────────────────────
  async getConversations(
    agentId: string,
    orgId: string,
    page = 1,
    limit = 20,
    status?: AiConversationStatus,
  ) {
    const filter: any = {
      agentId: new Types.ObjectId(agentId),
      organization: new Types.ObjectId(orgId),
    };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .select('-messages')
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.conversationModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getConversationMessages(conversationId: string, orgId: string) {
    return this.conversationModel.findOne({
      _id: conversationId,
      organization: new Types.ObjectId(orgId),
    }).exec();
  }

  // ── Test query — no WhatsApp send, no conversation tracking ──────────
  async testQuery(agentId: string, orgId: string, message: string): Promise<{
    reply: string;
    chunks: any[];
    processingMs: number;
    inputTokens?: number;
    outputTokens?: number;
    agentUsed: { name: string; provider: string; model: string };
    knowledgeUsed: number;
    systemPromptPreview: string;
  }> {
    const start = Date.now();

    const agent = await this.agentsService.findOneWithKey(agentId);
    if (!agent) throw new Error('Agent not found');

    // Vector search (no usage tracking for test)
    const chunks = await this.vectorSearch.search(
      message,
      agentId,
      5,
      agent.confidenceThreshold ?? 0.65,
    );

    // Build system prompt (same logic as real replies)
    let systemContent = agent.systemPrompt ?? 'You are a helpful assistant.';
    if (agent.hardRules?.length) {
      systemContent += '\n\nIMPORTANT RULES:\n' + agent.hardRules.map((r, i) => `${i + 1}. ${r}`).join('\n');
    }
    if (chunks.length > 0) {
      const context = chunks
        .map((c) => `[${c.metadata?.title ?? 'Knowledge'}]\n${c.content}`)
        .join('\n\n---\n\n');
      systemContent += `\n\nUse the following knowledge to answer the user:\n\n${context}`;
    }

    const aiMessages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: message },
    ];

    let reply = agent.cantAnswerMessage ?? "I don't have information on that.";
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    if (chunks.length > 0 || !agent.cantAnswerMessage) {
      try {
        const response = await this.aiProvider.chat(
          aiMessages,
          agent.provider,
          agent.model,
          (agent as any).apiKey,
          { temperature: agent.temperature, maxTokens: agent.maxTokens },
        );
        reply = response.text;
        inputTokens = response.inputTokens;
        outputTokens = response.outputTokens;
      } catch (err: any) {
        reply = `[AI Error: ${err?.message}]`;
      }
    }

    return {
      reply,
      chunks: chunks.map((c) => ({
        content: c.content.slice(0, 300) + (c.content.length > 300 ? '...' : ''),
        score: Math.round(c.score * 1000) / 1000,
        title: c.metadata?.title,
        type: c.metadata?.type,
        knowledgeId: c.knowledgeId,
      })),
      processingMs: Date.now() - start,
      inputTokens,
      outputTokens,
      agentUsed: { name: agent.name, provider: agent.provider, model: agent.model },
      knowledgeUsed: chunks.length,
      systemPromptPreview: systemContent.slice(0, 500) + (systemContent.length > 500 ? '...' : ''),
    };
  }

  // ── Conversation analytics ─────────────────────────────────────────────
  async getConversationStats(agentId: string, orgId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalActive,
      totalHandedOff,
      totalResolved,
      dailyCounts,
    ] = await Promise.all([
      this.conversationModel.countDocuments({
        agentId: new Types.ObjectId(agentId),
        organization: new Types.ObjectId(orgId),
        status: 'active',
      }),
      this.conversationModel.countDocuments({
        agentId: new Types.ObjectId(agentId),
        organization: new Types.ObjectId(orgId),
        status: 'handed_off',
      }),
      this.conversationModel.countDocuments({
        agentId: new Types.ObjectId(agentId),
        organization: new Types.ObjectId(orgId),
        status: 'resolved',
      }),
      this.conversationModel.aggregate([
        {
          $match: {
            agentId: new Types.ObjectId(agentId),
            organization: new Types.ObjectId(orgId),
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      totalActive,
      totalHandedOff,
      totalResolved,
      total: totalActive + totalHandedOff + totalResolved,
      handoffRate:
        totalActive + totalHandedOff + totalResolved > 0
          ? Math.round((totalHandedOff / (totalActive + totalHandedOff + totalResolved)) * 100)
          : 0,
      dailyCounts: dailyCounts.map((d: any) => ({ date: d._id, count: d.count })),
    };
  }
}
