import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * Partner routes credit a wallet without anyone paying the BSP, so an organization's own API
 * key is not enough: that key sits on the partner's servers *and* can be handed to the
 * organization itself. The partner also proves who it is with a shared secret
 * (PARTNER_TOPUP_SECRET). Unset = partner routes are off.
 */
@Injectable()
export class PartnerSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = (this.config.get<string>('PARTNER_TOPUP_SECRET') ?? '').trim();
    if (!expected) {
      throw new ForbiddenException('Partner top-up is not enabled on this server');
    }

    const request = context.switchToHttp().getRequest();
    const given = request.headers['x-partner-secret'];
    if (typeof given !== 'string' || !given) {
      throw new UnauthorizedException('Missing X-Partner-Secret header');
    }

    // Compare fixed-length digests so neither the length nor the content leaks through timing.
    const a = createHash('sha256').update(given, 'utf8').digest();
    const b = createHash('sha256').update(expected, 'utf8').digest();
    if (!timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid partner secret');
    }
    return true;
  }
}
