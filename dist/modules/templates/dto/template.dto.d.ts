import { TemplateCategory } from '../schemas/template.schema';
export declare class TemplateButtonDto {
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
}
export declare class TemplateComponentDto {
    type: string;
    format?: string;
    text?: string;
    buttons?: TemplateButtonDto[];
    example?: any;
}
export declare class CreateTemplateDto {
    name: string;
    category: TemplateCategory;
    language: string;
    components: TemplateComponentDto[];
    wabaId?: string;
}
export declare class TemplateQueryDto {
    status?: string;
    category?: string;
    wabaId?: string;
    search?: string;
}
