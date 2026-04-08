import type { Response } from 'express';
import { WebhookService } from './webhook.service';
export declare class WebhookController {
    private readonly webhookService;
    private readonly logger;
    constructor(webhookService: WebhookService);
    verify(mode: string, token: string, challenge: string, res: Response): Response<any, Record<string, any>>;
    receive(body: any, signature: string, req: any): Promise<{
        status: string;
    }>;
}
