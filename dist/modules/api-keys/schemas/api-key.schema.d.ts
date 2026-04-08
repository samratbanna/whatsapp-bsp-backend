import { Document, Types } from 'mongoose';
export type ApiKeyDocument = ApiKey & Document;
export declare class ApiKey {
    organization: Types.ObjectId;
    createdBy: Types.ObjectId;
    name: string;
    key: string;
    keyPrefix: string;
    isActive: boolean;
    scopes: string[];
    lastUsedAt?: Date;
    expiresAt?: Date;
}
export declare const ApiKeySchema: import("mongoose").Schema<ApiKey, import("mongoose").Model<ApiKey, any, any, any, any, any, ApiKey>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ApiKey, Document<unknown, {}, ApiKey, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    key?: import("mongoose").SchemaDefinitionProperty<string, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    keyPrefix?: import("mongoose").SchemaDefinitionProperty<string, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scopes?: import("mongoose").SchemaDefinitionProperty<string[], ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastUsedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ApiKey, Document<unknown, {}, ApiKey, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ApiKey & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ApiKey>;
