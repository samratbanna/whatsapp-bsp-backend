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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, UserStatus } from '../../common/enums';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Super admin: full user management ─────────────────────────────
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiQuery({ name: 'orgId', required: false })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  findAll(
    @Query('orgId') orgId?: string,
    @Query('status') status?: UserStatus,
  ) {
    return this.usersService.findAll(orgId, status);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  suspend(@Param('id') id: string) {
    return this.usersService.suspend(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ── Self: any logged-in user ───────────────────────────────────────
  @Get('me/profile')
  getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Put('me/profile')
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    // Strip role/status — user cannot change their own role
    const { role, status, ...safe } = dto;
    return this.usersService.update(userId, safe);
  }

  @Patch('me/change-password')
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }
}
