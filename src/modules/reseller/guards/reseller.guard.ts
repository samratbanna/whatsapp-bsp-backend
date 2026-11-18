import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { OrganizationsService } from '../../organizations/organizations.service';
import { OrgStatus, Role } from '../../../common/enums';

/**
 * Runs after JwtAuthGuard. Lets through only the org admin of an organization the super admin
 * has enabled as a reseller, and puts that organization on `req.reseller`.
 *
 * Checked against the database on every request (not a JWT claim), so turning reseller off or
 * suspending the reseller takes effect immediately.
 */
@Injectable()
export class ResellerGuard implements CanActivate {
  constructor(private readonly orgsService: OrganizationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.orgId || user.role !== Role.ORG_ADMIN) {
      throw new ForbiddenException(
        'The reseller panel is only for the reseller organization admin',
      );
    }

    const org = await this.orgsService.findOne(user.orgId).catch(() => null);
    if (!org?.isReseller) {
      throw new ForbiddenException(
        'Your organization is not enabled as a reseller',
      );
    }
    if (org.status === OrgStatus.SUSPENDED) {
      throw new ForbiddenException('Your organization is suspended');
    }

    req.reseller = org;
    return true;
  }
}
