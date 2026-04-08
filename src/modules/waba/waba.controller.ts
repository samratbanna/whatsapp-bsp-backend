import {
  Controller, Get, Post, Put, Delete, Body,
  Param, UseGuards, Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { WabaService } from './waba.service';
import { ConnectWabaDto, UpdateWabaDto, AssignSharedWabaDto } from './dto/waba.dto';

@ApiTags('WABA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waba')
export class WabaController {
  constructor(private readonly wabaService: WabaService) {}

  // ── Org: connect own (BYO) WABA ────────────────────────────────────
  @Post('connect')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  connect(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: ConnectWabaDto,
  ) {
    return this.wabaService.connect(orgId, dto);
  }

  @Get()
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN, Role.AGENT)
  findAll(@CurrentUser('orgId') orgId: string) {
    return this.wabaService.findByOrg(orgId);
  }

  @Get(':id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.wabaService.findOne(id, orgId);
  }

  @Put(':id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateWabaDto,
  ) {
    return this.wabaService.update(id, orgId, dto);
  }

  @Patch(':id/disconnect')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  disconnect(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.wabaService.disconnect(id, orgId);
  }

  @Delete(':id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.wabaService.remove(id, orgId);
  }

  // ── Super admin: assign BSP-owned SHARED WABA to any org ──────────
  @Post('admin/assign-shared')
  @Roles(Role.SUPER_ADMIN)
  assignShared(@Body() dto: AssignSharedWabaDto) {
    return this.wabaService.assignShared(dto);
  }
}
