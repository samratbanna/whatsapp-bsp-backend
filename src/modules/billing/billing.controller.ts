import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { BillingService } from './billing.service';
import {
  AdminOrderQueryDto,
  BalancePurchaseDto,
  CreateOrderDto,
  MarkPaidDto,
  OrderQueryDto,
  PageQueryDto,
} from './dto/billing.dto';

/** Org admin buys messages at its own rates and follows its orders. */
@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('rates')
  @ApiOperation({
    summary: 'My per-message rates (paise), GST, and how I pay',
    description:
      "channel 'airpay': pay online (direct customers, resellers). channel 'balance': a reseller's " +
      'client buying from the balance its reseller loaded.',
  })
  rates(@CurrentUser('orgId') orgId: string) {
    return this.billingService.myRates(orgId);
  }

  @Post('orders')
  @ApiOperation({
    summary: 'Start online checkout for a number of messages per category',
    description:
      'Total = quantity × my rate per category, plus GST. Returns the order and an Airpay form ' +
      '({ url, method, fields }). The browser must POST those fields to url right away (the ' +
      'gateway token is short-lived).',
  })
  create(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.billingService.createOrder(orgId, userId, dto);
  }

  @Post('purchase')
  @ApiOperation({
    summary:
      "Reseller client: buy messages from my balance at my reseller's rates",
  })
  purchase(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: BalancePurchaseDto,
  ) {
    return this.billingService.buyWithBalance(orgId, userId, dto);
  }

  @Get('balance/transactions')
  @ApiOperation({ summary: 'Reseller client: money balance history' })
  balanceHistory(
    @CurrentUser('orgId') orgId: string,
    @Query() query: PageQueryDto,
  ) {
    return this.billingService.balanceHistory(orgId, query);
  }

  @Get('orders')
  list(@CurrentUser('orgId') orgId: string, @Query() query: OrderQueryDto) {
    return this.billingService.listForOrg(orgId, query);
  }

  @Get('orders/:orderNumber')
  get(
    @CurrentUser('orgId') orgId: string,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.billingService.getForOrg(orgId, orderNumber);
  }

  @Post('orders/:orderNumber/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Re-check an open order with the gateway (payment result page polls this)',
  })
  refresh(
    @CurrentUser('orgId') orgId: string,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.billingService.refreshForOrg(orgId, orderNumber);
  }
}

/**
 * Called by Airpay, not by our frontend: the browser's return redirect and the server-to-server
 * IPN. Neither is trusted on its own — see BillingService.confirm.
 */
@ApiTags('Billing')
@UseGuards(ThrottlerGuard)
@Controller('billing/airpay')
export class AirpayCallbackController {
  constructor(
    private readonly billingService: BillingService,
    private readonly config: ConfigService,
  ) {}

  @Post('return')
  @ApiExcludeEndpoint()
  async returnPost(
    @Body() body: Record<string, any>,
    @Query() query: Record<string, any>,
    @Res() res: Response,
  ) {
    return this.finish(
      await this.billingService.handleReturn(body, query),
      res,
    );
  }

  @Get('return')
  @ApiExcludeEndpoint()
  async returnGet(@Query() query: Record<string, any>, @Res() res: Response) {
    return this.finish(await this.billingService.handleReturn({}, query), res);
  }

  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async ipn(@Body() body: Record<string, any>) {
    await this.billingService.handleIpn(body);
    return { status: 'ok' };
  }

  /** Send the browser to the frontend result page, which polls the order's status. */
  private finish(orderNumber: string | null, res: Response) {
    const base =
      (this.config.get<string>('BILLING_RESULT_URL') ?? '').trim() ||
      `${(this.config.get<string>('FRONTEND_URL') ?? '').trim().replace(/\/+$/, '')}/vendor-billing/result`;
    if (!base.startsWith('http')) {
      return res.status(200).json({ orderNumber });
    }
    const url = orderNumber
      ? `${base}?order=${encodeURIComponent(orderNumber)}`
      : base;
    // 303: the browser follows with a GET even though Airpay POSTed to us.
    return res.redirect(303, url);
  }
}

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/billing')
export class AdminBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('orders')
  list(@Query() query: AdminOrderQueryDto) {
    return this.billingService.listAll(query);
  }

  @Post('orders/:orderNumber/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Ask Airpay for the order's status now and apply it",
  })
  verify(@Param('orderNumber') orderNumber: string) {
    return this.billingService.adminVerify(orderNumber);
  }

  @Post('orders/:orderNumber/mark-paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mark an order paid by hand (payment confirmed outside the verify API) and load its credits',
  })
  markPaid(
    @Param('orderNumber') orderNumber: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.billingService.markPaid(orderNumber, dto, adminId);
  }
}
