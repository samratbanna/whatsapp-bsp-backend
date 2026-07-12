import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { AiAgentsService } from './ai-agents.service';
import { CreateAiAgentDto, UpdateAiAgentDto, SetDefaultAgentDto } from './dto/ai-agent.dto';

@ApiTags('AI Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('ai-agents')
export class AiAgentsController {
  constructor(private readonly agentsService: AiAgentsService) {}

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
}
