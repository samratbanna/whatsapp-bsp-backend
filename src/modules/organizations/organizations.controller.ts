import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { OrganizationsService } from './organizations.service';
import {
  AssignResellerDto,
  CreateOrganizationDto,
  OrgListQueryDto,
  SetResellerDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(dto);
  }

  @Get()
  findAll(@Query() query: OrgListQueryDto) {
    return this.orgsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgsService.update(id, dto);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.orgsService.suspend(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.orgsService.activate(id);
  }

  @Patch(':id/reseller')
  @ApiOperation({ summary: 'Enable / disable reseller capability for an organization' })
  setReseller(@Param('id') id: string, @Body() dto: SetResellerDto) {
    return this.orgsService.setReseller(id, dto.enabled);
  }

  @Patch(':id/assign-reseller')
  @ApiOperation({ summary: 'Move an organization under a reseller, or detach it (resellerId: null)' })
  assignReseller(@Param('id') id: string, @Body() dto: AssignResellerDto) {
    return this.orgsService.assignReseller(id, dto.resellerId ?? null);
  }

  @Get(':id/clients')
  @ApiOperation({ summary: "List a reseller's client organizations" })
  findClients(@Param('id') id: string, @Query() query: OrgListQueryDto) {
    return this.orgsService.findAll({ ...query, resellerId: id, kind: undefined });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orgsService.remove(id);
  }
}
