import { BadRequestException } from '@nestjs/common';

/**
 * Thrown by MetaApiService when the Graph API returns a structured error.
 * Preserves the Meta error code so callers such as token-refresh logic
 * can inspect it (e.g. code 190 = token expired / invalid).
 */
export class MetaApiException extends BadRequestException {
  constructor(
    public readonly metaCode: number,
    public readonly metaSubCode: number | undefined,
    message: string,
  ) {
    super(message);
  }
}
