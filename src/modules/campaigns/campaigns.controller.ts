import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './dto/campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@CurrentUser('orgId') orgId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(orgId, dto);
  }

  @Get()
  findAll(@CurrentUser('orgId') orgId: string, @Query() query: CampaignQueryDto) {
    return this.campaignsService.findAll(orgId, query);
  }

  @Get('stats')
  getStats(@CurrentUser('orgId') orgId: string) {
    return this.campaignsService.getStats(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.campaignsService.findOne(id, orgId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, orgId, dto);
  }

  @Patch(':id/launch')
  launch(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.campaignsService.launch(id, orgId);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.campaignsService.pause(id, orgId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.campaignsService.cancel(id, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.campaignsService.remove(id, orgId);
  }
}
