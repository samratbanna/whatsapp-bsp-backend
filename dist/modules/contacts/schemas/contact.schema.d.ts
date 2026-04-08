import { Document, Types } from 'mongoose';
export type ContactDocument = Contact & Document;
export declare class Contact {
    organization: Types.ObjectId;
    phone: string;
    name?: string;
    email?: string;
    avatar?: string;
    groups: Types.ObjectId[];
    customFields: Record<string, string>;
    isWhatsAppUser: boolean;
    lastMessageAt?: Date;
    optedOut: boolean;
    optedOutAt?: Date;
    notes?: string;
    labels: string[];
}
export declare const ContactSchema: import("mongoose").Schema<Contact, import("mongoose").Model<Contact, any, any, any, any, any, Contact>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Contact, Document<unknown, {}, Contact, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string | undefined, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string | undefined, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    avatar?: import("mongoose").SchemaDefinitionProperty<string | undefined, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    groups?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    customFields?: import("mongoose").SchemaDefinitionProperty<Record<string, string>, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isWhatsAppUser?: import("mongoose").SchemaDefinitionProperty<boolean, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessageAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    optedOut?: import("mongoose").SchemaDefinitionProperty<boolean, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    optedOutAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    notes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    labels?: import("mongoose").SchemaDefinitionProperty<string[], Contact, Document<unknown, {}, Contact, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Contact & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Contact>;
export type ContactGroupDocument = ContactGroup & Document;
export declare class ContactGroup {
    organization: Types.ObjectId;
    name: string;
    description?: string;
    contactCount: number;
}
export declare const ContactGroupSchema: import("mongoose").Schema<ContactGroup, import("mongoose").Model<ContactGroup, any, any, any, any, any, ContactGroup>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ContactGroup, Document<unknown, {}, ContactGroup, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ContactGroup & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organization?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ContactGroup, Document<unknown, {}, ContactGroup, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContactGroup & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, ContactGroup, Document<unknown, {}, ContactGroup, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContactGroup & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, ContactGroup, Document<unknown, {}, ContactGroup, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContactGroup & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    contactCount?: import("mongoose").SchemaDefinitionProperty<number, ContactGroup, Document<unknown, {}, ContactGroup, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ContactGroup & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ContactGroup>;
