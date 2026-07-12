import {
  Injectable, Logger, NotFoundException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiAgent, AiAgentDocument, AiAgentStatus } from './schemas/ai-agent.schema';
import { CreateAiAgentDto, UpdateAiAgentDto } from './dto/ai-agent.dto';

@Injectable()
export class AiAgentsService {
  private readonly logger = new Logger(AiAgentsService.name);

  constructor(
    @InjectModel(AiAgent.name) private agentModel: Model<AiAgentDocument>,
  ) {}

  async create(orgId: string, dto: CreateAiAgentDto): Promise<AiAgentDocument> {
    // Ek org me ek hi default agent ho sakta hai per WABA (ya org-level)
    if (dto.isDefault) {
      await this.agentModel.updateMany(
        {
          organization: new Types.ObjectId(orgId),
          ...(dto.wabaId ? { waba: new Types.ObjectId(dto.wabaId) } : {}),
        },
        { $set: { isDefault: false } },
      );
    }

    return this.agentModel.create({
      organization: new Types.ObjectId(orgId),
      ...(dto.wabaId ? { waba: new Types.ObjectId(dto.wabaId) } : {}),
      name: dto.name,
      description: dto.description,
      provider: dto.provider,
      model: dto.model,
      apiKey: dto.apiKey,
      systemPrompt: dto.systemPrompt,
      hardRules: dto.hardRules || [],
      temperature: dto.temperature ?? 0.7,
      maxTokens: dto.maxTokens ?? 500,
      maxHistoryTurns: dto.maxHistoryTurns ?? 10,
      maxTurnsBeforeHandoff: dto.maxTurnsBeforeHandoff ?? 50,
      handoffKeywords: dto.handoffKeywords ?? ['human', 'agent', 'support', 'help me'],
      handoffMessage: dto.handoffMessage,
      cantAnswerMessage: dto.cantAnswerMessage,
      confidenceThreshold: dto.confidenceThreshold ?? 0.65,
      showCitations: dto.showCitations ?? false,
      isDefault: dto.isDefault ?? false,
    });
  }

  async findAll(orgId: string): Promise<AiAgentDocument[]> {
    return this.agentModel
      .find({ organization: new Types.ObjectId(orgId) })
      .select('-apiKey')
      .populate('waba', 'displayPhoneNumber')
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async findOne(id: string, orgId: string): Promise<AiAgentDocument> {
    const agent = await this.agentModel
      .findOne({ _id: id, organization: new Types.ObjectId(orgId) })
      .select('-apiKey')
      .populate('waba', 'displayPhoneNumber')
      .exec();
    if (!agent) throw new NotFoundException('AI Agent not found');
    return agent;
  }

  // Internal use only — includes apiKey for AI calls
  async findOneWithKey(id: string): Promise<AiAgentDocument> {
    const agent = await this.agentModel
      .findById(id)
      .select('+apiKey')
      .exec();
    if (!agent) throw new NotFoundException('AI Agent not found');
    return agent;
  }

  async update(id: string, orgId: string, dto: UpdateAiAgentDto): Promise<AiAgentDocument> {
    if (dto.isDefault) {
      await this.agentModel.updateMany(
        {
          organization: new Types.ObjectId(orgId),
          _id: { $ne: new Types.ObjectId(id) },
          ...(dto.wabaId ? { waba: new Types.ObjectId(dto.wabaId) } : {}),
        },
        { $set: { isDefault: false } },
      );
    }

    const agent = await this.agentModel
      .findOneAndUpdate(
        { _id: id, organization: new Types.ObjectId(orgId) },
        {
          $set: {
            ...dto,
            ...(dto.wabaId ? { waba: new Types.ObjectId(dto.wabaId) } : {}),
          },
        },
        { new: true },
      )
      .select('-apiKey')
      .exec();

    if (!agent) throw new NotFoundException('AI Agent not found');
    return agent;
  }

  async remove(id: string, orgId: string): Promise<void> {
    const agent = await this.agentModel.findOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (!agent) throw new NotFoundException('AI Agent not found');
    await agent.deleteOne();
  }

  async setDefault(id: string, orgId: string, wabaId?: string): Promise<AiAgentDocument> {
    // Unset any existing default for this waba/org
    await this.agentModel.updateMany(
      {
        organization: new Types.ObjectId(orgId),
        ...(wabaId ? { waba: new Types.ObjectId(wabaId) } : {}),
      },
      { $set: { isDefault: false } },
    );

    const agent = await this.agentModel
      .findOneAndUpdate(
        { _id: id, organization: new Types.ObjectId(orgId) },
        {
          $set: {
            isDefault: true,
            ...(wabaId ? { waba: new Types.ObjectId(wabaId) } : {}),
          },
        },
        { new: true },
      )
      .select('-apiKey')
      .exec();

    if (!agent) throw new NotFoundException('AI Agent not found');
    this.logger.log(`Default AI agent set: ${agent.name} (${id}) for org=${orgId}`);
    return agent;
  }

  async toggleStatus(id: string, orgId: string): Promise<AiAgentDocument> {
    const agent = await this.agentModel.findOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (!agent) throw new NotFoundException('AI Agent not found');

    agent.status = agent.status === AiAgentStatus.ACTIVE
      ? AiAgentStatus.INACTIVE
      : AiAgentStatus.ACTIVE;

    return agent.save();
  }

  // Called by webhook/executor when a conversation ends with AI
  async incrementStats(
    id: string,
    field: 'totalConversations' | 'totalReplies' | 'totalHandoffs',
  ): Promise<void> {
    await this.agentModel.updateOne(
      { _id: id },
      { $inc: { [field]: 1 } },
    );
  }

  // Find default active agent for a given org+waba
  async findDefault(orgId: string, wabaId?: string): Promise<AiAgentDocument | null> {
    const filter: any = {
      organization: new Types.ObjectId(orgId),
      isDefault: true,
      status: AiAgentStatus.ACTIVE,
    };
    if (wabaId) filter.waba = new Types.ObjectId(wabaId);

    return this.agentModel.findOne(filter).select('+apiKey').exec();
  }
}
