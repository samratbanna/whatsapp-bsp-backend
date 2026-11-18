import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrgStatus } from '../../common/enums';
import { WalletTxQueryDto } from '../wallet/dto/wallet.dto';
import { ResellerGuard } from './guards/reseller.guard';
import { ResellerService } from './reseller.service';
import {
  BalanceChangeDto,
  ClientListQueryDto,
  CreateClientDto,
  TransferCreditsDto,
  UpdateClientDto,
} from './dto/reseller.dto';
import { RatesDto } from '../rates/dto/rates.dto';
import { PageQueryDto, SalesQueryDto } from '../billing/dto/billing.dto';

/**
 * Reseller panel. Every route is scoped to the caller's own reseller organization
 * (`req.reseller`, set by ResellerGuard); a client id that belongs to anyone else is a 404.
 */
@ApiTags('Reseller')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ResellerGuard)
@Controller('reseller')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Own credits and rates, client counts, transfer totals and sales',
  })
  dashboard(@Req() req: any) {
    return this.resellerService.dashboard(req.reseller);
  }

  @Get('transfers')
  @ApiOperation({
    summary: 'Own credit transfer history (to and from clients)',
  })
  transfers(@Req() req: any, @Query() query: WalletTxQueryDto) {
    return this.resellerService.transfers(req.reseller._id.toString(), query);
  }

  @Get('sales')
  @ApiOperation({
    summary: 'Messages clients bought from their balance, with cost and margin',
  })
  sales(@Req() req: any, @Query() query: SalesQueryDto) {
    return this.resellerService.sales(req.reseller._id.toString(), query);
  }

  // ── Clients ────────────────────────────────────────────────────────

  @Post('clients')
  @ApiOperation({
    summary: 'Onboard a client organization with its admin login',
  })
  createClient(
    @Req() req: any,
    @Body() dto: CreateClientDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.resellerService.createClient(req.reseller, dto, userId);
  }

  @Get('clients')
  listClients(@Req() req: any, @Query() query: ClientListQueryDto) {
    return this.resellerService.listClients(req.reseller._id.toString(), query);
  }

  @Get('clients/:id')
  getClient(@Req() req: any, @Param('id') id: string) {
    return this.resellerService.getClient(req.reseller._id.toString(), id);
  }

  @Put('clients/:id')
  updateClient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.resellerService.updateClient(
      req.reseller._id.toString(),
      id,
      dto,
    );
  }

  @Patch('clients/:id/suspend')
  suspendClient(@Req() req: any, @Param('id') id: string) {
    return this.resellerService.setClientStatus(
      req.reseller._id.toString(),
      id,
      OrgStatus.SUSPENDED,
    );
  }

  @Patch('clients/:id/activate')
  activateClient(@Req() req: any, @Param('id') id: string) {
    return this.resellerService.setClientStatus(
      req.reseller._id.toString(),
      id,
      OrgStatus.ACTIVE,
    );
  }

  @Get('clients/:id/summary')
  clientSummary(@Req() req: any, @Param('id') id: string) {
    return this.resellerService.clientSummary(req.reseller._id.toString(), id);
  }

  @Get('clients/:id/transactions')
  clientTransactions(
    @Req() req: any,
    @Param('id') id: string,
    @Query() query: WalletTxQueryDto,
  ) {
    return this.resellerService.clientTransactions(
      req.reseller._id.toString(),
      id,
      query,
    );
  }

  // ── Rates ──────────────────────────────────────────────────────────

  @Put('clients/:id/rates')
  @ApiOperation({
    summary:
      'What the client pays per message (paise); null removes a rate (category not for sale)',
  })
  setRates(@Req() req: any, @Param('id') id: string, @Body() dto: RatesDto) {
    return this.resellerService.setClientRates(
      req.reseller._id.toString(),
      id,
      dto,
    );
  }

  // ── Money balance ──────────────────────────────────────────────────

  @Post('clients/:id/balance/add')
  @ApiOperation({
    summary: "Load money (₹) on the client's balance after collecting it",
  })
  addBalance(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: BalanceChangeDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.resellerService.changeClientBalance(
      req.reseller,
      id,
      dto,
      userId,
      'add',
    );
  }

  @Post('clients/:id/balance/deduct')
  @ApiOperation({ summary: "Take money (₹) back off the client's balance" })
  deductBalance(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: BalanceChangeDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.resellerService.changeClientBalance(
      req.reseller,
      id,
      dto,
      userId,
      'deduct',
    );
  }

  @Get('clients/:id/balance/transactions')
  clientBalanceTransactions(
    @Req() req: any,
    @Param('id') id: string,
    @Query() query: PageQueryDto,
  ) {
    return this.resellerService.clientBalanceTransactions(
      req.reseller._id.toString(),
      id,
      query,
    );
  }

  // ── Credits ────────────────────────────────────────────────────────

  @Post('clients/:id/credits/allocate')
  @ApiOperation({
    summary: "Move credits from the reseller's wallet to the client's",
  })
  allocate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: TransferCreditsDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.resellerService.allocate(req.reseller, id, dto, userId);
  }

  @Post('clients/:id/credits/revoke')
  @ApiOperation({
    summary: "Take unused credits back from the client's wallet",
  })
  revoke(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: TransferCreditsDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.resellerService.revoke(req.reseller, id, dto, userId);
  }
}
