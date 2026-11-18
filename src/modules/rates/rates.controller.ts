import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { RatesService } from './rates.service';
import { RatesDto, UpdateRateSettingsDto } from './dto/rates.dto';

/** Website pricing page and calculator — no login. */
@ApiTags('Rates')
@Controller('rates')
export class PublicRatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Default per-message rates (paise), GST % and minimum purchase (public)',
  })
  async get() {
    const s = await this.ratesService.getSettings();
    return {
      rates: s.defaultRates,
      gstPercent: s.gstPercent,
      minPurchase: s.minPurchase,
    };
  }
}

@ApiTags('Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/rates')
export class AdminRatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  settings() {
    return this.ratesService.getSettings();
  }

  @Put()
  @ApiOperation({
    summary:
      'Default rates (paise per message), GST % and minimum online purchase (₹)',
  })
  update(
    @Body() dto: UpdateRateSettingsDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.ratesService.updateSettings(dto, adminId);
  }

  @Get('organizations/:id')
  orgRates(@Param('id') id: string) {
    return this.ratesService.orgRates(id);
  }

  @Put('organizations/:id')
  @ApiOperation({
    summary: "Set an organization's own rates (null = back to default)",
  })
  setOrgRates(@Param('id') id: string, @Body() dto: RatesDto) {
    return this.ratesService.setOrgRates(id, dto);
  }
}
