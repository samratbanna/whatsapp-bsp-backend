import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MetaApiException } from '../exceptions/meta-api.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const baseResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'object' && 'message' in (message as object)
          ? (message as any).message
          : message,
    };

    // Forward Meta-specific error fields so frontend can show user-friendly text
    if (exception instanceof MetaApiException) {
      baseResponse.metaCode      = exception.metaCode;
      baseResponse.metaSubCode   = exception.metaSubCode ?? null;
      baseResponse.errorUserTitle = exception.errorUserTitle ?? null;
      baseResponse.errorUserMsg  = exception.errorUserMsg ?? null;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response.status(status).json(baseResponse);
  }
}
