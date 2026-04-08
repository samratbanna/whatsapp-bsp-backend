import { Document, Types } from 'mongoose';
export type CampaignDocument = Campaign & Document;
export declare enum CampaignStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    RUNNING = "running",
    COMPLETED = "completed",
    PAUSED = "paused",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum CampaignType {
    BROADCAST = "broadcast",
    SCHEDULED = "scheduled"
}
export declare class Campaign {
    organization: Types.ObjectId;
    waba: Types.ObjectId;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    template: Types.ObjectId;
    templateLanguage: string;
    templateVariables: Record<string, string>;
    contacts: Types.ObjectId[];
    groups: Types.ObjectId[];
    scheduledAt?: Date;
    totalCount: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
    messagesPerSecond: number;
    jobId?: string;
    startedAt?: Date;
    completedAt?: Date;
    failureReason?: string;
}
export declare const CampaignSchema: import("mongoose").Schema<Campaign, import("mongoose").Model<Campaign, any, any, any, any, any, Campaign>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Campaign, Document<unknown, {}, Campaign, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    waba?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<CampaignType, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<CampaignStatus, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    template?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    templateLanguage?: import("mongoose").SchemaDefinitionProperty<string, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    templateVariables?: import("mongoose").SchemaDefinitionProperty<Record<string, string>, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    contacts?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    groups?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    scheduledAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalCount?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sentCount?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveredCount?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    readCount?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    failedCount?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    messagesPerSecond?: import("mongoose").SchemaDefinitionProperty<number, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    jobId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    completedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    failureReason?: import("mongoose").SchemaDefinitionProperty<string | undefined, Campaign, Document<unknown, {}, Campaign, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Campaign & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Campaign>;
