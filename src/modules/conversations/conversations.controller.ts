import {
  Controller, Get, Post, Patch, Body, Query,
  Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ConversationsService } from './conversations.service';
import {
  ConversationListDto, ConversationMessagesDto,
  UpdateConversationStatusDto, AssignConversationDto, UpdateLabelsDto,
} from './dto/conversation.dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN, Role.AGENT)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // Paginated inbox list
  @Get()
  list(
    @CurrentUser('orgId') orgId: string,
    @Query() dto: ConversationListDto,
  ) {
    return this.conversationsService.list(orgId, dto);
  }

  // Single conversation detail
  @Get(':id')
  findOne(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.conversationsService.findOne(orgId, id);
  }

  // Paginated message history (oldest first — chat style)
  @Get(':id/messages')
  getMessages(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Query() dto: ConversationMessagesDto,
  ) {
    return this.conversationsService.getMessages(orgId, id, dto);
  }

  // Update status: open | resolved
  @Patch(':id/status')
  updateStatus(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversationStatusDto,
  ) {
    return this.conversationsService.updateStatus(orgId, id, dto.status);
  }

  // Assign agent
  @Patch(':id/assign')
  assignAgent(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.conversationsService.assignAgent(orgId, id, dto.userId);
  }

  // Update labels
  @Patch(':id/labels')
  updateLabels(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLabelsDto,
  ) {
    return this.conversationsService.updateLabels(orgId, id, dto.labels);
  }

  // Mark all inbound messages as read, clear unread badge
  @Post(':id/mark-read')
  markRead(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.conversationsService.markRead(orgId, id);
  }
}
