import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppConfigService } from './app-config.service';
import { AppConfig } from './schemas/app-config.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('App Config')
@Controller('app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  // Public — frontend fetches branding
  @Get('public')
  getPublic() {
    return this.appConfigService.getPublic();
  }

  // Admin only
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  get() {
    return this.appConfigService.get(true);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  update(@Body() data: Partial<AppConfig>) {
    return this.appConfigService.update(data);
  }
}
