import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/api-key.dto';

@ApiTags('API Keys (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  getAllKeys() {
    return this.apiKeysService.getAllKeys();
  }

  @Get(':orgId')
  async getForOrg(@Param('orgId') orgId: string) {
    const key = await this.apiKeysService.getForOrg(orgId);
    if (!key) {
      throw new NotFoundException('API key not found for organization');
    }
    return key;
  }

  @Post(':orgId/generate')
  generateForOrg(
    @Param('orgId') orgId: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.generateForOrg(orgId, adminId, dto);
  }

  @Post(':orgId/reset')
  resetForOrg(
    @Param('orgId') orgId: string,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.apiKeysService.resetForOrg(orgId, adminId);
  }

  @Patch(':orgId/revoke')
  revokeForOrg(@Param('orgId') orgId: string) {
    return this.apiKeysService.revokeForOrg(orgId);
  }
}
