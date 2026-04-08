import { Document, Types } from 'mongoose';
export type PricingRateDocument = PricingRate & Document;
export declare enum MessageCategory {
    MARKETING = "marketing",
    UTILITY = "utility",
    AUTHENTICATION = "authentication",
    SERVICE = "service"
}
export declare class PricingRate {
    key: string;
    marketingBase: number;
    utilityBase: number;
    authenticationBase: number;
    serviceBase: number;
    marketingMarkup: number;
    utilityMarkup: number;
    authenticationMarkup: number;
    serviceMarkup: number;
    marketingEffective: number;
    utilityEffective: number;
    authenticationEffective: number;
    serviceEffective: number;
    lastUpdatedBy?: string;
}
export declare const PricingRateSchema: import("mongoose").Schema<PricingRate, import("mongoose").Model<PricingRate, any, any, any, any, any, PricingRate>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PricingRate, Document<unknown, {}, PricingRate, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    key?: import("mongoose").SchemaDefinitionProperty<string, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    marketingBase?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    utilityBase?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    authenticationBase?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceBase?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    marketingMarkup?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    utilityMarkup?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    authenticationMarkup?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceMarkup?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    marketingEffective?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    utilityEffective?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    authenticationEffective?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceEffective?: import("mongoose").SchemaDefinitionProperty<number, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastUpdatedBy?: import("mongoose").SchemaDefinitionProperty<string | undefined, PricingRate, Document<unknown, {}, PricingRate, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PricingRate & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PricingRate>;
export type PlanPricingDocument = PlanPricing & Document;
export declare class PlanPricing {
    plan: Types.ObjectId;
    marketingEffective?: number;
    utilityEffective?: number;
    authenticationEffective?: number;
    serviceEffective?: number;
}
export declare const PlanPricingSchema: import("mongoose").Schema<PlanPricing, import("mongoose").Model<PlanPricing, any, any, any, any, any, PlanPricing>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PlanPricing, Document<unknown, {}, PlanPricing, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PlanPricing & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    plan?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, PlanPricing, Document<unknown, {}, PlanPricing, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlanPricing & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    marketingEffective?: import("mongoose").SchemaDefinitionProperty<number | undefined, PlanPricing, Document<unknown, {}, PlanPricing, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlanPricing & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    utilityEffective?: import("mongoose").SchemaDefinitionProperty<number | undefined, PlanPricing, Document<unknown, {}, PlanPricing, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlanPricing & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    authenticationEffective?: import("mongoose").SchemaDefinitionProperty<number | undefined, PlanPricing, Document<unknown, {}, PlanPricing, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlanPricing & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    serviceEffective?: import("mongoose").SchemaDefinitionProperty<number | undefined, PlanPricing, Document<unknown, {}, PlanPricing, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlanPricing & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PlanPricing>;
