import { Document, Types } from 'mongoose';
import { OrgStatus } from '../../../common/enums';
export type OrganizationDocument = Organization & Document;
export declare class Organization {
    name: string;
    slug: string;
    logo?: string;
    website?: string;
    status: OrgStatus;
    trialEndsAt?: Date;
    messagesUsedThisMonth: number;
    usageResetAt: Date;
    wabaIds: Types.ObjectId[];
    billingEmail?: string;
    phone?: string;
    address?: string;
    country?: string;
    timezone: string;
}
export declare const OrganizationSchema: import("mongoose").Schema<Organization, import("mongoose").Model<Organization, any, any, any, any, any, Organization>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Organization, Document<unknown, {}, Organization, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    slug?: import("mongoose").SchemaDefinitionProperty<string, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    logo?: import("mongoose").SchemaDefinitionProperty<string | undefined, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    website?: import("mongoose").SchemaDefinitionProperty<string | undefined, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<OrgStatus, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trialEndsAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    messagesUsedThisMonth?: import("mongoose").SchemaDefinitionProperty<number, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    usageResetAt?: import("mongoose").SchemaDefinitionProperty<Date, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    wabaIds?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    billingEmail?: import("mongoose").SchemaDefinitionProperty<string | undefined, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string | undefined, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    address?: import("mongoose").SchemaDefinitionProperty<string | undefined, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    country?: import("mongoose").SchemaDefinitionProperty<string | undefined, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    timezone?: import("mongoose").SchemaDefinitionProperty<string, Organization, Document<unknown, {}, Organization, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Organization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Organization>;
