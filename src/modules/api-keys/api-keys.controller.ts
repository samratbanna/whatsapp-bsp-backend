import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ApiKeysService, CreateApiKeyDto } from './api-keys.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(orgId, userId, dto);
  }

  @Get()
  findAll(@CurrentUser('orgId') orgId: string) {
    return this.apiKeysService.findAll(orgId);
  }

  @Patch(':id/revoke')
  revoke(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.apiKeysService.revoke(id, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.apiKeysService.remove(id, orgId);
  }
}
