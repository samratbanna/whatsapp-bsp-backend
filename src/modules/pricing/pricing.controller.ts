import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { PricingService } from './pricing.service';
import { UpdatePricingDto, UpdatePlanPricingDto } from './dto/pricing.dto';

@ApiTags('Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // Public — clients can see what they'll be charged
  @Get('rates')
  getGlobalRates() {
    return this.pricingService.getGlobalRates();
  }

  // Super admin only
  @Put('rates')
  @Roles(Role.SUPER_ADMIN)
  updateGlobalRates(
    @Body() dto: UpdatePricingDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.pricingService.updateGlobalRates(dto, adminId);
  }

  @Put('plans/:planId')
  @Roles(Role.SUPER_ADMIN)
  setPlanPricing(
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanPricingDto,
  ) {
    return this.pricingService.setPlanPricing(planId, dto);
  }

  @Get('plans/:planId')
  @Roles(Role.SUPER_ADMIN)
  getPlanPricing(@Param('planId') planId: string) {
    return this.pricingService.getPlanPricing(planId);
  }
}
