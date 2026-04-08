import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ContactsService } from './contacts.service';
import {
  CreateContactDto, UpdateContactDto, ContactQueryDto,
  BulkImportDto, CreateGroupDto,
} from './dto/contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN, Role.AGENT)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // ── Contacts ───────────────────────────────────────────────────────
  @Post()
  create(@CurrentUser('orgId') orgId: string, @Body() dto: CreateContactDto) {
    return this.contactsService.create(orgId, dto);
  }

  @Post('bulk-import')
  bulkImport(@CurrentUser('orgId') orgId: string, @Body() dto: BulkImportDto) {
    return this.contactsService.bulkImport(orgId, dto);
  }

  @Get()
  findAll(@CurrentUser('orgId') orgId: string, @Query() query: ContactQueryDto) {
    return this.contactsService.findAll(orgId, query);
  }

  @Get('stats')
  getStats(@CurrentUser('orgId') orgId: string) {
    return this.contactsService.getStats(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.contactsService.findOne(id, orgId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, orgId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.contactsService.remove(id, orgId);
  }

  // ── Groups ─────────────────────────────────────────────────────────
  @Post('groups')
  createGroup(@CurrentUser('orgId') orgId: string, @Body() dto: CreateGroupDto) {
    return this.contactsService.createGroup(orgId, dto);
  }

  @Get('groups/all')
  findAllGroups(@CurrentUser('orgId') orgId: string) {
    return this.contactsService.findAllGroups(orgId);
  }

  @Get('groups/:groupId/contacts')
  findGroupContacts(
    @Param('groupId') groupId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.contactsService.findGroupContacts(groupId, orgId);
  }

  @Delete('groups/:groupId')
  removeGroup(
    @Param('groupId') groupId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.contactsService.removeGroup(groupId, orgId);
  }
}
