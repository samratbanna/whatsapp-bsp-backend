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
import { ConnectWabaDto, UpdateWabaDto, AssignOrgDto } from './dto/waba.dto';

@ApiTags('WABA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waba')
export class WabaController {
  constructor(private readonly wabaService: WabaService) {}

  // ── Super admin: register a WABA in the pool ───────────────────────
  @Post('connect')
  @Roles(Role.SUPER_ADMIN)
  connect(@Body() dto: ConnectWabaDto) {
    return this.wabaService.connect(dto);
  }

  // ── SUPER_ADMIN sees all; ORG_ADMIN/AGENT see their org's WABAs ────
  @Get()
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN, Role.AGENT)
  findAll(
    @CurrentUser('role') role: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    if (role === Role.SUPER_ADMIN) return this.wabaService.findAll();
    return this.wabaService.findByOrg(orgId);
  }

  @Get(':id')
  @Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    if (role === Role.SUPER_ADMIN) return this.wabaService.findOne(id);
    return this.wabaService.findOne(id, orgId);
  }

  // ── Super admin only: update / disconnect / delete ─────────────────
  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWabaDto,
  ) {
    return this.wabaService.update(id, dto);
  }

  @Patch(':id/disconnect')
  @Roles(Role.SUPER_ADMIN)
  disconnect(@Param('id') id: string) {
    return this.wabaService.disconnect(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.wabaService.remove(id);
  }

  // ── Super admin: assign / unassign a WABA to/from an org ───────────
  @Post(':id/assign')
  @Roles(Role.SUPER_ADMIN)
  assignToOrg(
    @Param('id') id: string,
    @Body() dto: AssignOrgDto,
  ) {
    return this.wabaService.assignToOrg(id, dto.orgId);
  }

  @Delete(':id/assign/:orgId')
  @Roles(Role.SUPER_ADMIN)
  unassignFromOrg(
    @Param('id') id: string,
    @Param('orgId') orgId: string,
  ) {
    return this.wabaService.unassignFromOrg(id, orgId);
  }
}
