export declare class MetaApiService {
    private readonly logger;
    private client;
    sendMessage(phoneNumberId: string, accessToken: string, payload: any): Promise<any>;
    getTemplates(wabaId: string, accessToken: string): Promise<any>;
    createTemplate(wabaId: string, accessToken: string, payload: any): Promise<any>;
    deleteTemplate(wabaId: string, accessToken: string, templateName: string): Promise<any>;
    getPhoneNumberInfo(phoneNumberId: string, accessToken: string): Promise<any>;
    markAsRead(phoneNumberId: string, accessToken: string, messageId: string): Promise<any>;
    uploadMedia(phoneNumberId: string, accessToken: string, buffer: Buffer, mimeType: string): Promise<any>;
    verifySignature(payload: string, signature: string, appSecret: string): boolean;
}
