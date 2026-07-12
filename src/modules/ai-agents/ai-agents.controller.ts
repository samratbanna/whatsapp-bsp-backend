import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { AiAgentsService } from './ai-agents.service';
import { AiReplyService } from './ai-reply.service';
import { AiKnowledgeService } from './ai-knowledge.service';
import { AiConversationStatus } from './schemas/ai-conversation.schema';
import { CreateAiAgentDto, UpdateAiAgentDto, SetDefaultAgentDto } from './dto/ai-agent.dto';

class TestQueryDto {
  @IsString() @IsNotEmpty() message: string;
}

@ApiTags('AI Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('ai-agents')
export class AiAgentsController {
  constructor(
    private readonly agentsService: AiAgentsService,
    private readonly replyService: AiReplyService,
    private readonly knowledgeService: AiKnowledgeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new AI agent' })
  create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateAiAgentDto,
  ) {
    return this.agentsService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all AI agents for this org' })
  findAll(@CurrentUser('orgId') orgId: string) {
    return this.agentsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent detail' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.agentsService.findOne(id, orgId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent config' })
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateAiAgentDto,
  ) {
    return this.agentsService.update(id, orgId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.agentsService.remove(id, orgId);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set as default agent for a WABA' })
  setDefault(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: SetDefaultAgentDto,
  ) {
    return this.agentsService.setDefault(id, orgId, dto.wabaId);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle agent active/inactive' })
  toggleStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.agentsService.toggleStatus(id, orgId);
  }

  // ── Conversation Dashboard ─────────────────────────────────────────────
  @Get(':id/conversations')
  @ApiOperation({ summary: 'List conversations for this agent' })
  getConversations(
    @Param('id') agentId: string,
    @CurrentUser('orgId') orgId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: AiConversationStatus,
  ) {
    return this.replyService.getConversations(
      agentId,
      orgId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
    );
  }

  @Get(':id/conversations/:convId')
  @ApiOperation({ summary: 'Get messages for a specific conversation' })
  getConversation(
    @Param('convId') convId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.replyService.getConversationMessages(convId, orgId);
  }

  @Patch(':id/conversations/:convId/resolve')
  @ApiOperation({ summary: 'Resolve a handed-off conversation' })
  resolveConversation(
    @Param('convId') convId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.replyService.resolveConversation(convId, orgId);
  }

  @Patch(':id/conversations/:convId/reactivate')
  @ApiOperation({ summary: 'Re-activate AI for a resolved conversation' })
  reactivate(
    @Param('convId') convId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.replyService.reactivate(convId, orgId);
  }

  // ── Test Query ────────────────────────────────────────────────────────
  @Post(':id/test')
  @ApiOperation({ summary: 'Test the agent with a message — returns AI reply + retrieved chunks, no WhatsApp send' })
  testQuery(
    @Param('id') agentId: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: TestQueryDto,
  ) {
    return this.replyService.testQuery(agentId, orgId, dto.message);
  }

  // ── Analytics ─────────────────────────────────────────────────────────
  @Get(':id/analytics')
  @ApiOperation({ summary: 'Agent analytics: conversation counts, handoff rate, daily trend' })
  getAnalytics(
    @Param('id') agentId: string,
    @CurrentUser('orgId') orgId: string,
    @Query('days') days: string,
  ) {
    return this.replyService.getConversationStats(agentId, orgId, days ? Number(days) : 30);
  }

  @Get(':id/knowledge-analytics')
  @ApiOperation({ summary: 'Knowledge usage analytics: which docs are retrieved most' })
  getKnowledgeAnalytics(
    @Param('id') agentId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.getUsageAnalytics(agentId, orgId);
  }
}
