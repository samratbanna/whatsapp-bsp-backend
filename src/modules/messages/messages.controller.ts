import {
  Controller, Get, Post, Patch, Body, Query, Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { MessagesService } from './messages.service';
import { SendTextDto, SendTemplateDto, SendMediaDto, MessageQueryDto } from './dto/message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN, Role.AGENT)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send/text')
  sendText(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: SendTextDto,
  ) {
    return this.messagesService.sendText(orgId, dto);
  }

  @Post('send/template')
  sendTemplate(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: SendTemplateDto,
  ) {
    return this.messagesService.sendTemplate(orgId, dto);
  }

  @Post('send/media')
  sendMedia(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: SendMediaDto,
  ) {
    return this.messagesService.sendMedia(orgId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.messagesService.findAll(orgId, query);
  }

  @Get('conversations')
  getConversations(
    @CurrentUser('orgId') orgId: string,
    @Query('wabaId') wabaId?: string,
  ) {
    return this.messagesService.getConversations(orgId, wabaId);
  }

  @Get('stats')
  getStats(@CurrentUser('orgId') orgId: string) {
    return this.messagesService.getStats(orgId);
  }

  // Mark all inbound messages from a contact as read
  @Patch('read/:phone')
  markRead(
    @CurrentUser('orgId') orgId: string,
    @Param('phone') phone: string,
  ) {
    return this.messagesService.markConversationRead(orgId, phone);
  }
}
