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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, OrgStatus } from '../../common/enums';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
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
  @ApiQuery({ name: 'status', enum: OrgStatus, required: false })
  findAll(@Query('status') status?: OrgStatus) {
    return this.orgsService.findAll(status);
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orgsService.remove(id);
  }
}
