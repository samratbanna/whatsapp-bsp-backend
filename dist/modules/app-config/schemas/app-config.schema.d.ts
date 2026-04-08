import { Document } from 'mongoose';
export type AppConfigDocument = AppConfig & Document;
export declare class AppConfig {
    key: string;
    appName: string;
    appLogo?: string;
    appFavicon?: string;
    primaryColor: string;
    landingPageEnabled: boolean;
    heroTitle?: string;
    heroSubtitle?: string;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
    smtpEnabled: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    smtpFromEmail?: string;
    smtpFromName?: string;
    metaAppId?: string;
    metaAppSecret?: string;
    metaWebhookVerifyToken?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    footerText?: string;
    supportEmail?: string;
    supportPhone?: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
}
export declare const AppConfigSchema: import("mongoose").Schema<AppConfig, import("mongoose").Model<AppConfig, any, any, any, any, any, AppConfig>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppConfig, Document<unknown, {}, AppConfig, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    key?: import("mongoose").SchemaDefinitionProperty<string, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appName?: import("mongoose").SchemaDefinitionProperty<string, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appLogo?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    appFavicon?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    primaryColor?: import("mongoose").SchemaDefinitionProperty<string, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    landingPageEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    heroTitle?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    heroSubtitle?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registrationEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    emailVerificationRequired?: import("mongoose").SchemaDefinitionProperty<boolean, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    smtpEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    smtpHost?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    smtpPort?: import("mongoose").SchemaDefinitionProperty<number | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    smtpUser?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    smtpPassword?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    smtpFromEmail?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    smtpFromName?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metaAppId?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metaAppSecret?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metaWebhookVerifyToken?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    facebookUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    twitterUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkedinUrl?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    footerText?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    supportEmail?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    supportPhone?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maintenanceMode?: import("mongoose").SchemaDefinitionProperty<boolean, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maintenanceMessage?: import("mongoose").SchemaDefinitionProperty<string | undefined, AppConfig, Document<unknown, {}, AppConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AppConfig>;
