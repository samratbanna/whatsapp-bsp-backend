import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { PartnerSecretGuard } from './guards/partner-secret.guard';
import { RequestLoggerInterceptor } from './interceptors/request-logger.interceptor';
import { WalletService } from '../wallet/wallet.service';
import { PartnerTopupDto } from '../wallet/dto/wallet.dto';

/**
 * Server-to-server routes for a reseller partner. The organization is identified by its own
 * X-API-Key, exactly as on the rest of the public API; the partner secret is checked first so
 * an unauthenticated caller learns nothing about which keys are valid.
 *
 * No throttling on purpose: a partner retrying a paid top-up must never be told to back off.
 */
@ApiTags('Public API — Partner')
@ApiSecurity('X-API-Key')
@ApiHeader({ name: 'X-Partner-Secret', required: true, description: 'Shared partner secret (PARTNER_TOPUP_SECRET)' })
@UseGuards(PartnerSecretGuard, ApiKeyGuard)
@UseInterceptors(RequestLoggerInterceptor)
@Controller('public/v1/partner')
export class PartnerWalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({
    summary: 'Load purchased message credits into the organization wallet',
    description:
      'Idempotent by `reference`: repeating a reference returns `duplicate: true` and the original transaction, and adds nothing.',
  })
  @Post('wallet/topup')
  @HttpCode(HttpStatus.OK)
  async topup(@Req() req: any, @Body() dto: PartnerTopupDto) {
    const result = await this.walletService.partnerTopup(req.orgId, dto);
    return {
      duplicate: result.duplicate,
      transactionId: result.transaction?._id ?? null,
      creditsAfter: result.transaction?.creditsAfter ?? null,
      credits: result.credits,
    };
  }
}
