import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { RequestLoggerInterceptor } from './interceptors/request-logger.interceptor';
import { MessagesService } from '../messages/messages.service';
import { TemplatesService } from '../templates/templates.service';
import { WabaService } from '../waba/waba.service';
import { ContactsService } from '../contacts/contacts.service';

@ApiTags('Public API')
@ApiSecurity('X-API-Key')
@UseGuards(ApiKeyGuard, ThrottlerGuard)
@UseInterceptors(RequestLoggerInterceptor)
@Controller('public/v1')
export class PublicApiController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly templatesService: TemplatesService,
    private readonly wabaService: WabaService,
    private readonly contactsService: ContactsService,
  ) {}

  @Post('messages/text')
  async sendText(
    @Req() req: any,
    @Body() dto: { to: string; text: string; wabaId?: string },
  ) {
    const orgId = req.orgId;
    const result = (await this.messagesService.sendText(orgId, dto as any)) as any;
    return {
      success: true,
      messageId: result?.messageId || 'msg_live_' + Date.now(),
      status: 'sent',
    };
  }

  @Post('messages/template')
  async sendTemplate(
    @Req() req: any,
    @Body() dto: {
      to: string;
      templateName: string;
      languageCode: string;
      components?: any[];
      wabaId?: string;
    },
  ) {
    const orgId = req.orgId;
    const result = (await this.messagesService.sendTemplate(orgId, dto as any)) as any;
    return {
      success: true,
      messageId: result?.messageId || 'msg_live_' + Date.now(),
      status: 'sent',
    };
  }

  @Post('messages/media')
  async sendMedia(
    @Req() req: any,
    @Body() dto: {
      to: string;
      type: string;
      mediaUrl: string;
      caption?: string;
      wabaId?: string;
    },
  ) {
    const orgId = req.orgId;
    const result = (await this.messagesService.sendMedia(orgId, dto as any)) as any;
    return {
      success: true,
      messageId: result?.messageId || 'msg_live_' + Date.now(),
      status: 'sent',
    };
  }

  @Get('templates')
  getTemplates(@Req() req: any, @Query() query: any) {
    const orgId = req.orgId;
    return this.templatesService.findAll(orgId, query);
  }

  @Post('templates')
  createTemplate(@Req() req: any, @Body() dto: any) {
    const orgId = req.orgId;
    return this.templatesService.create(orgId, dto as any);
  }

  @Get('waba')
  async getWaba(@Req() req: any) {
    const orgId = req.orgId;
    const result = (await this.wabaService.findByOrg(orgId)) as any;
    if (!result) return [];

    const wabas = Array.isArray(result) ? result : [result];

    return wabas.map((w: any) => ({
      phoneNumberId: w?.phoneNumberId,
      displayPhoneNumber: w?.displayPhoneNumber,
      status: w?.status,
      ownershipType: w?.ownershipType,
    }));
  }

  @Post('contacts')
  createContact(
    @Req() req: any,
    @Body() dto: { phone: string; name?: string; email?: string; labels?: string[] },
  ) {
    const orgId = req.orgId;
    return this.contactsService.create(orgId, dto as any);
  }

  @Get('contacts')
  getContacts(@Req() req: any, @Query() query: any) {
    const orgId = req.orgId;
    return this.contactsService.findAll(orgId, query);
  }
}
