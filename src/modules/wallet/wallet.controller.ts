import {
  Controller, Get, Post, Put, Body,
  Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { WalletService } from './wallet.service';
import {
  AddCreditsDto, BulkAddCreditsDto,
  UpdateWalletSettingsDto, WalletTxQueryDto,
} from './dto/wallet.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ── Org user: own wallet ───────────────────────────────────────────

  @Get()
  getMyWallet(@CurrentUser('orgId') orgId: string) {
    return this.walletService.getOrCreate(orgId);
  }

  @Get('credits')
  getCredits(@CurrentUser('orgId') orgId: string) {
    return this.walletService.getCredits(orgId);
  }

  @Get('summary')
  getSummary(@CurrentUser('orgId') orgId: string) {
    return this.walletService.getUsageSummary(orgId);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser('orgId') orgId: string,
    @Query() query: WalletTxQueryDto,
  ) {
    return this.walletService.getTransactions(orgId, query);
  }

  @Put('settings')
  @UseGuards(RolesGuard)
  @Roles(Role.ORG_ADMIN)
  updateSettings(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateWalletSettingsDto,
  ) {
    return this.walletService.updateSettings(orgId, dto);
  }

  // ── Super admin: manage any org wallet ────────────────────────────

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getAllWallets() {
    return this.walletService.getAllWallets();
  }

  @Get('admin/:orgId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getOrgWallet(@Param('orgId') orgId: string) {
    return this.walletService.getOrCreate(orgId);
  }

  @Get('admin/:orgId/summary')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getOrgSummary(@Param('orgId') orgId: string) {
    return this.walletService.getUsageSummary(orgId);
  }

  @Get('admin/:orgId/transactions')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getOrgTransactions(
    @Param('orgId') orgId: string,
    @Query() query: WalletTxQueryDto,
  ) {
    return this.walletService.getTransactions(orgId, query);
  }

  // Super admin: add credits to a specific category
  @Post('admin/:orgId/add-credits')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  addCredits(
    @Param('orgId') orgId: string,
    @Body() dto: AddCreditsDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.walletService.addCredits(orgId, dto, adminId);
  }

  // Super admin: add credits to all categories at once
  @Post('admin/:orgId/bulk-add')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  bulkAddCredits(
    @Param('orgId') orgId: string,
    @Body() dto: BulkAddCreditsDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.walletService.bulkAddCredits(orgId, dto, adminId);
  }
}
