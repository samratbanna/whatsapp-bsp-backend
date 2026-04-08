import { Document, Types } from 'mongoose';
export type FlowDocument = Flow & Document;
export declare enum FlowStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DRAFT = "draft"
}
export declare enum NodeType {
    TRIGGER = "trigger",
    SEND_TEXT = "send_text",
    SEND_TEMPLATE = "send_template",
    SEND_MEDIA = "send_media",
    CONDITION = "condition",
    SET_VARIABLE = "set_variable",
    API_REQUEST = "api_request",
    DELAY = "delay",
    JUMP = "jump",
    END = "end",
    ASSIGN_AGENT = "assign_agent",
    ADD_LABEL = "add_label",
    RESET_FLOW = "reset_flow"
}
export declare class Flow {
    organization: Types.ObjectId;
    waba: Types.ObjectId;
    name: string;
    description?: string;
    status: FlowStatus;
    trigger: {
        type: 'keyword' | 'any_message' | 'opt_in' | 'button_reply';
        keywords?: string[];
        caseSensitive?: boolean;
    };
    nodes: {
        id: string;
        type: NodeType;
        label?: string;
        position?: {
            x: number;
            y: number;
        };
        data: Record<string, any>;
        next?: string;
        branches?: {
            condition: string;
            next: string;
        }[];
    }[];
    triggerCount: number;
    completionCount: number;
    priority: number;
}
export declare const FlowSchema: import("mongoose").Schema<Flow, import("mongoose").Model<Flow, any, any, any, any, any, Flow>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Flow, Document<unknown, {}, Flow, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    waba?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<FlowStatus, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trigger?: import("mongoose").SchemaDefinitionProperty<{
        type: "keyword" | "any_message" | "opt_in" | "button_reply";
        keywords?: string[];
        caseSensitive?: boolean;
    }, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nodes?: import("mongoose").SchemaDefinitionProperty<{
        id: string;
        type: NodeType;
        label?: string;
        position?: {
            x: number;
            y: number;
        };
        data: Record<string, any>;
        next?: string;
        branches?: {
            condition: string;
            next: string;
        }[];
    }[], Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    triggerCount?: import("mongoose").SchemaDefinitionProperty<number, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    completionCount?: import("mongoose").SchemaDefinitionProperty<number, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    priority?: import("mongoose").SchemaDefinitionProperty<number, Flow, Document<unknown, {}, Flow, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Flow & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Flow>;
export type FlowSessionDocument = FlowSession & Document;
export declare class FlowSession {
    organization: Types.ObjectId;
    phone: string;
    flow: Types.ObjectId;
    currentNodeId: string;
    variables: Record<string, string>;
    isActive: boolean;
    expiresAt: Date;
}
export declare const FlowSessionSchema: import("mongoose").Schema<FlowSession, import("mongoose").Model<FlowSession, any, any, any, any, any, FlowSession>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FlowSession, Document<unknown, {}, FlowSession, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, FlowSession, Document<unknown, {}, FlowSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, FlowSession, Document<unknown, {}, FlowSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    flow?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, FlowSession, Document<unknown, {}, FlowSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currentNodeId?: import("mongoose").SchemaDefinitionProperty<string, FlowSession, Document<unknown, {}, FlowSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    variables?: import("mongoose").SchemaDefinitionProperty<Record<string, string>, FlowSession, Document<unknown, {}, FlowSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, FlowSession, Document<unknown, {}, FlowSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, FlowSession, Document<unknown, {}, FlowSession, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<FlowSession & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, FlowSession>;
