import { Document, Types } from 'mongoose';
export type WabaDocument = Waba & Document;
export declare enum WabaStatus {
    ACTIVE = "active",
    DISCONNECTED = "disconnected",
    PENDING = "pending",
    BANNED = "banned"
}
export declare enum WabaOwnershipType {
    BYO = "byo",
    SHARED = "shared"
}
export declare class Waba {
    organization: Types.ObjectId;
    ownershipType: WabaOwnershipType;
    wabaId: string;
    phoneNumberId: string;
    displayPhoneNumber: string;
    verifiedName?: string;
    accessToken: string;
    status: WabaStatus;
    qualityRating?: string;
    webhookVerifyToken?: string;
    isDefault: boolean;
    label?: string;
    poolLabel?: string;
    walletBillingEnabled: boolean;
}
export declare const WabaSchema: import("mongoose").Schema<Waba, import("mongoose").Model<Waba, any, any, any, any, any, Waba>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Waba, Document<unknown, {}, Waba, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    ownershipType?: import("mongoose").SchemaDefinitionProperty<WabaOwnershipType, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    wabaId?: import("mongoose").SchemaDefinitionProperty<string, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phoneNumberId?: import("mongoose").SchemaDefinitionProperty<string, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    displayPhoneNumber?: import("mongoose").SchemaDefinitionProperty<string, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    verifiedName?: import("mongoose").SchemaDefinitionProperty<string | undefined, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    accessToken?: import("mongoose").SchemaDefinitionProperty<string, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<WabaStatus, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    qualityRating?: import("mongoose").SchemaDefinitionProperty<string | undefined, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    webhookVerifyToken?: import("mongoose").SchemaDefinitionProperty<string | undefined, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isDefault?: import("mongoose").SchemaDefinitionProperty<boolean, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    label?: import("mongoose").SchemaDefinitionProperty<string | undefined, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    poolLabel?: import("mongoose").SchemaDefinitionProperty<string | undefined, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    walletBillingEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, Waba, Document<unknown, {}, Waba, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Waba & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Waba>;
