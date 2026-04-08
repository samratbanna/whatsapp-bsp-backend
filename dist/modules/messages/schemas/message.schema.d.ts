import { Document, Types } from 'mongoose';
export type MessageDocument = Message & Document;
export declare enum MessageDirection {
    INBOUND = "inbound",
    OUTBOUND = "outbound"
}
export declare enum MessageStatus {
    QUEUED = "queued",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    FAILED = "failed"
}
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    DOCUMENT = "document",
    TEMPLATE = "template",
    INTERACTIVE = "interactive",
    LOCATION = "location",
    STICKER = "sticker",
    REACTION = "reaction",
    CONTACTS = "contacts"
}
export declare class Message {
    organization: Types.ObjectId;
    waba: Types.ObjectId;
    metaMessageId?: string;
    metaConversationId?: string;
    from: string;
    to: string;
    direction: MessageDirection;
    type: MessageType;
    status: MessageStatus;
    content: {
        text?: string;
        mediaUrl?: string;
        mediaId?: string;
        mimeType?: string;
        caption?: string;
        filename?: string;
        templateName?: string;
        templateLanguage?: string;
        templateComponents?: any[];
        interactive?: any;
        location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
        };
        reaction?: {
            messageId: string;
            emoji: string;
        };
    };
    contact: Types.ObjectId | null;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    conversationWindowExpiry?: Date;
    campaign: Types.ObjectId | null;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, any, any, Message>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, Message, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    waba?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metaMessageId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metaConversationId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    from?: import("mongoose").SchemaDefinitionProperty<string, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    to?: import("mongoose").SchemaDefinitionProperty<string, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    direction?: import("mongoose").SchemaDefinitionProperty<MessageDirection, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<MessageType, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<MessageStatus, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    content?: import("mongoose").SchemaDefinitionProperty<{
        text?: string;
        mediaUrl?: string;
        mediaId?: string;
        mimeType?: string;
        caption?: string;
        filename?: string;
        templateName?: string;
        templateLanguage?: string;
        templateComponents?: any[];
        interactive?: any;
        location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
        };
        reaction?: {
            messageId: string;
            emoji: string;
        };
    }, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    contact?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveredAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    readAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    failedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    failureReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    conversationWindowExpiry?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    campaign?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, Message, Document<unknown, {}, Message, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Message & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Message>;
