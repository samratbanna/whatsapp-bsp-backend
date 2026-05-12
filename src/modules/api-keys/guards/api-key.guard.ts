import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    @InjectModel('Organization') private organizationModel: Model<any>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const { valid, orgId, scopes, allowedIps } = await this.apiKeysService.validateKey(apiKeyHeader as string);

    if (!valid || !orgId) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    const organization = await this.organizationModel.findById(orgId).select('status').exec();
    if (!organization) {
      throw new UnauthorizedException('Organization not found');
    }

    if (organization.status !== 'active') {
      throw new ForbiddenException('Organization is suspended');
    }

    if (allowedIps && allowedIps.length > 0) {
      let clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
      if (Array.isArray(clientIp)) {
        clientIp = clientIp[0];
      }
      if (typeof clientIp === 'string') {
        clientIp = clientIp.split(',')[0].trim();
      }
      
      if (!allowedIps.includes(clientIp)) {
        throw new ForbiddenException(`IP address ${clientIp} is not allowed`);
      }
    }

    request.orgId = orgId;
    request.apiKeyScopes = scopes || [];

    return true;
  }
}
