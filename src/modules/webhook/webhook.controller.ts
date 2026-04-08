import {
  Controller, Get, Post, Body, Query, Headers,
  Res, HttpCode, Logger, Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { WebhookService } from './webhook.service';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && this.webhookService.verifyToken(token)) {
      this.logger.log('✅ Webhook verified by Meta');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  @Post()
  @HttpCode(200)
  async receive(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: any,
  ) {
    this.webhookService.processEvent(body, signature, req.rawBody).catch((err) =>
      this.logger.error('Webhook processing error', err),
    );
    return { status: 'ok' };
  }
}
