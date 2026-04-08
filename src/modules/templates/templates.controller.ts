import {
  Controller, Get, Post, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, TemplateQueryDto } from './dto/template.dto';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(orgId, dto);
  }

  @Post('sync')
  sync(
    @CurrentUser('orgId') orgId: string,
    @Query('wabaId') wabaId?: string,
  ) {
    return this.templatesService.syncFromMeta(orgId, wabaId);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: TemplateQueryDto,
  ) {
    return this.templatesService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.templatesService.findOne(id, orgId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.templatesService.remove(id, orgId);
  }
}
