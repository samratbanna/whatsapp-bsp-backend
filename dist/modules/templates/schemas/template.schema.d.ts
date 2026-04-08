import { Document, Types } from 'mongoose';
export type TemplateDocument = Template & Document;
export declare enum TemplateCategory {
    MARKETING = "MARKETING",
    UTILITY = "UTILITY",
    AUTHENTICATION = "AUTHENTICATION"
}
export declare enum TemplateStatus {
    APPROVED = "APPROVED",
    PENDING = "PENDING",
    REJECTED = "REJECTED",
    PAUSED = "PAUSED",
    DISABLED = "DISABLED"
}
export declare class Template {
    organization: Types.ObjectId;
    waba: Types.ObjectId;
    metaTemplateId?: string;
    name: string;
    category: TemplateCategory;
    language: string;
    status: TemplateStatus;
    rejectedReason?: string;
    components: {
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
        format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
        text?: string;
        buttons?: {
            type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
            text: string;
            url?: string;
            phone_number?: string;
        }[];
        example?: any;
    }[];
    variables: string[];
    lastSyncedAt?: Date;
}
export declare const TemplateSchema: import("mongoose").Schema<Template, import("mongoose").Model<Template, any, any, any, any, any, Template>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Template, Document<unknown, {}, Template, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    waba?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metaTemplateId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<TemplateCategory, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    language?: import("mongoose").SchemaDefinitionProperty<string, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<TemplateStatus, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rejectedReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    components?: import("mongoose").SchemaDefinitionProperty<{
        type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
        format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
        text?: string;
        buttons?: {
            type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
            text: string;
            url?: string;
            phone_number?: string;
        }[];
        example?: any;
    }[], Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    variables?: import("mongoose").SchemaDefinitionProperty<string[], Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastSyncedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Template, Document<unknown, {}, Template, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Template & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Template>;
