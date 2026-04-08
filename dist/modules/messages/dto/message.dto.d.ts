import { MessageType } from '../schemas/message.schema';
export declare class SendTextDto {
    to: string;
    text: string;
    wabaId?: string;
}
export declare class TemplateComponentParameter {
    type: string;
    text?: string;
    image?: {
        link: string;
    };
    document?: {
        link: string;
        filename?: string;
    };
}
export declare class TemplateComponent {
    type: string;
    sub_type?: string;
    index?: number;
    parameters?: TemplateComponentParameter[];
}
export declare class SendTemplateDto {
    to: string;
    templateName: string;
    languageCode: string;
    category?: string;
    components?: TemplateComponent[];
    wabaId?: string;
}
export declare class SendMediaDto {
    to: string;
    type: MessageType;
    mediaUrl: string;
    caption?: string;
    filename?: string;
    wabaId?: string;
}
export declare class MessageQueryDto {
    phone?: string;
    wabaId?: string;
    page?: number;
    limit?: number;
}
