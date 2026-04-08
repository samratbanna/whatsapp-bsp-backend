import { Document, Types } from 'mongoose';
export type WalletDocument = Wallet & Document;
export declare class Wallet {
    organization: Types.ObjectId;
    transactional: number;
    promotional: number;
    authentication: number;
    totalTransactionalAdded: number;
    totalPromotionalAdded: number;
    totalAuthenticationAdded: number;
    totalTransactionalUsed: number;
    totalPromotionalUsed: number;
    totalAuthenticationUsed: number;
    lowTransactionalThreshold: number;
    lowPromotionalThreshold: number;
    lowAuthenticationThreshold: number;
    lowTransactionalAlertSent: boolean;
    lowPromotionalAlertSent: boolean;
    lowAuthenticationAlertSent: boolean;
    blockOnEmpty: boolean;
}
export declare const WalletSchema: import("mongoose").Schema<Wallet, import("mongoose").Model<Wallet, any, any, any, any, any, Wallet>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Wallet, Document<unknown, {}, Wallet, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    transactional?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    promotional?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    authentication?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalTransactionalAdded?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalPromotionalAdded?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalAuthenticationAdded?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalTransactionalUsed?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalPromotionalUsed?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalAuthenticationUsed?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lowTransactionalThreshold?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lowPromotionalThreshold?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lowAuthenticationThreshold?: import("mongoose").SchemaDefinitionProperty<number, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lowTransactionalAlertSent?: import("mongoose").SchemaDefinitionProperty<boolean, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lowPromotionalAlertSent?: import("mongoose").SchemaDefinitionProperty<boolean, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lowAuthenticationAlertSent?: import("mongoose").SchemaDefinitionProperty<boolean, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    blockOnEmpty?: import("mongoose").SchemaDefinitionProperty<boolean, Wallet, Document<unknown, {}, Wallet, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Wallet & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Wallet>;
export declare enum WalletCategory {
    TRANSACTIONAL = "transactional",
    PROMOTIONAL = "promotional",
    AUTHENTICATION = "authentication"
}
export type WalletTransactionDocument = WalletTransaction & Document;
export declare enum TransactionType {
    CREDIT = "credit",
    DEBIT = "debit",
    REFUND = "refund"
}
export declare enum TransactionReason {
    ADMIN_TOPUP = "admin_topup",
    MESSAGE_USE = "message_use",
    REFUND = "refund",
    ADJUSTMENT = "adjustment",
    BONUS = "bonus",
    EXPIRY = "expiry"
}
export declare class WalletTransaction {
    organization: Types.ObjectId;
    wallet: Types.ObjectId;
    type: TransactionType;
    reason: TransactionReason;
    category: WalletCategory;
    credits: number;
    creditsBefore: number;
    creditsAfter: number;
    message?: Types.ObjectId;
    campaign?: Types.ObjectId;
    metaMessageId?: string;
    description?: string;
    performedBy?: string;
}
export declare const WalletTransactionSchema: import("mongoose").Schema<WalletTransaction, import("mongoose").Model<WalletTransaction, any, any, any, any, any, WalletTransaction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WalletTransaction, Document<unknown, {}, WalletTransaction, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    wallet?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<TransactionType, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<TransactionReason, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<WalletCategory, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    credits?: import("mongoose").SchemaDefinitionProperty<number, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    creditsBefore?: import("mongoose").SchemaDefinitionProperty<number, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    creditsAfter?: import("mongoose").SchemaDefinitionProperty<number, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    message?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    campaign?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metaMessageId?: import("mongoose").SchemaDefinitionProperty<string | undefined, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    performedBy?: import("mongoose").SchemaDefinitionProperty<string | undefined, WalletTransaction, Document<unknown, {}, WalletTransaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletTransaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, WalletTransaction>;
