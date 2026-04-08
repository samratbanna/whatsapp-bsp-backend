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
import { FlowBuilderService } from './flow-builder.service';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';

@ApiTags('Flow Builder')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('flows')
export class FlowBuilderController {
  constructor(private readonly flowService: FlowBuilderService) {}

  @Post()
  create(@CurrentUser('orgId') orgId: string, @Body() dto: CreateFlowDto) {
    return this.flowService.create(orgId, dto);
  }

  @Get()
  findAll(@CurrentUser('orgId') orgId: string, @Query('status') status?: string) {
    return this.flowService.findAll(orgId, status);
  }

  @Get('sessions')
  getActiveSessions(@CurrentUser('orgId') orgId: string) {
    return this.flowService.getActiveSessions(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.flowService.findOne(id, orgId);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser('orgId') orgId: string, @Body() dto: UpdateFlowDto) {
    return this.flowService.update(id, orgId, dto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.flowService.activate(id, orgId);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.flowService.deactivate(id, orgId);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.flowService.duplicate(id, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.flowService.remove(id, orgId);
  }
}
