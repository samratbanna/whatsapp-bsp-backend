import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Org dashboard
  @Get('dashboard')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  getDashboard(@CurrentUser('orgId') orgId: string) {
    return this.analyticsService.getDashboard(orgId);
  }

  @Get('messages/by-day')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  getMessagesByDay(
    @CurrentUser('orgId') orgId: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getMessagesByDay(orgId, days || 30);
  }

  @Get('campaigns')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  getCampaignStats(
    @CurrentUser('orgId') orgId: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.analyticsService.getCampaignStats(orgId, campaignId);
  }

  @Get('contacts/growth')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  getContactGrowth(
    @CurrentUser('orgId') orgId: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getContactGrowth(orgId, days || 30);
  }

  @Get('flows')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  getFlowStats(@CurrentUser('orgId') orgId: string) {
    return this.analyticsService.getFlowStats(orgId);
  }

  @Get('contacts/top')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  getTopContacts(
    @CurrentUser('orgId') orgId: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getTopContacts(orgId, limit || 10);
  }

  // Super admin: platform-wide
  @Get('platform')
  @Roles(Role.SUPER_ADMIN)
  getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }
}
