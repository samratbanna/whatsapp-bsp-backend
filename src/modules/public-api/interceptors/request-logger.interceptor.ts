import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PublicApiLog, PublicApiLogDocument } from '../schemas/public-api-log.schema';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(PublicApiLog.name)
    private publicApiLogModel: Model<PublicApiLogDocument>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const requestId = uuidv4();
    
    // Set headers
    response.setHeader('X-Request-Id', requestId);
    response.setHeader('X-RateLimit-Limit', '100');
    // Using a simple fixed remaining and reset for now as per requirement
    // Real implementation would pull this from Redis via Throttler
    response.setHeader('X-RateLimit-Remaining', '99'); 
    response.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 60);

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = response.statusCode;

        const apiKeyHeader = request.headers['x-api-key'] as string;
        const apiKeyPrefix = apiKeyHeader ? apiKeyHeader.substring(0, 16) : 'unknown';

        let ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
        if (Array.isArray(ip)) ip = ip[0];
        if (typeof ip === 'string') ip = ip.split(',')[0].trim();

        const orgId = request.orgId;

        // Fire and forget log saving
        if (orgId) {
          this.publicApiLogModel.create({
            orgId: new Types.ObjectId(orgId),
            apiKeyPrefix,
            method: request.method,
            path: request.originalUrl || request.url,
            statusCode,
            ip,
            requestId,
            durationMs,
          }).catch(err => {
            console.error('Failed to save public API log:', err);
          });
        }
      }),
    );
  }
}
