import { BadRequestException } from '@nestjs/common';

/**
 * Thrown by MetaApiService when the Graph API returns a structured error.
 * Preserves the Meta error code so callers such as token-refresh logic
 * can inspect it (e.g. code 190 = token expired / invalid).
 * Also carries user-facing title/message from Meta so the frontend can
 * display meaningful error text.
 */
export class MetaApiException extends BadRequestException {
  constructor(
    public readonly metaCode: number,
    public readonly metaSubCode: number | undefined,
    message: string,
    public readonly errorUserTitle?: string,
    public readonly errorUserMsg?: string,
  ) {
    super({
      message,
      metaCode,
      metaSubCode,
      errorUserTitle: errorUserTitle || null,
      errorUserMsg: errorUserMsg || null,
    });
  }
}
