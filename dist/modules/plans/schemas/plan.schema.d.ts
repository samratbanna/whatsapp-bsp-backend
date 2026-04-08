import { Document } from 'mongoose';
import { PlanStatus, PlanType } from '../../../common/enums';
export type PlanDocument = Plan & Document;
export declare class Plan {
    name: string;
    type: PlanType;
    price: number;
    status: PlanStatus;
    isDefault: boolean;
    monthlyMessageLimit: number;
    agentLimit: number;
    wabaLimit: number;
    templateLimit: number;
    broadcastLimit: number;
    flowBuilderAccess: boolean;
    apiAccess: boolean;
    webhookAccess: boolean;
    aiChatbotAccess: boolean;
    trialDays: number;
    description: string;
    features: string[];
}
export declare const PlanSchema: import("mongoose").Schema<Plan, import("mongoose").Model<Plan, any, any, any, any, any, Plan>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Plan, Document<unknown, {}, Plan, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<PlanType, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<PlanStatus, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isDefault?: import("mongoose").SchemaDefinitionProperty<boolean, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    monthlyMessageLimit?: import("mongoose").SchemaDefinitionProperty<number, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    agentLimit?: import("mongoose").SchemaDefinitionProperty<number, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    wabaLimit?: import("mongoose").SchemaDefinitionProperty<number, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    templateLimit?: import("mongoose").SchemaDefinitionProperty<number, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    broadcastLimit?: import("mongoose").SchemaDefinitionProperty<number, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    flowBuilderAccess?: import("mongoose").SchemaDefinitionProperty<boolean, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    apiAccess?: import("mongoose").SchemaDefinitionProperty<boolean, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    webhookAccess?: import("mongoose").SchemaDefinitionProperty<boolean, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    aiChatbotAccess?: import("mongoose").SchemaDefinitionProperty<boolean, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trialDays?: import("mongoose").SchemaDefinitionProperty<number, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    features?: import("mongoose").SchemaDefinitionProperty<string[], Plan, Document<unknown, {}, Plan, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Plan & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Plan>;
