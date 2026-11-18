import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

/** Website pricing page — no login. */
@ApiTags('Plans')
@Controller('plans')
export class PublicPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({
    summary: 'Active plans for the website pricing page (public)',
  })
  list() {
    return this.plansService.listPublic();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'One active plan by slug (public)' })
  get(@Param('slug') slug: string) {
    return this.plansService.getPublic(slug);
  }
}

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.plansService.present(await this.plansService.findOne(id));
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hide the plan from the website and checkout (orders keep it)',
  })
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }
}
