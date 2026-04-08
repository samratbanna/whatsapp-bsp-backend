import { Model, Types } from 'mongoose';
import { ApiKeyDocument } from './schemas/api-key.schema';
export declare class CreateApiKeyDto {
    name: string;
    scopes?: string[];
    expiresAt?: string;
}
export declare class ApiKeysService {
    private apiKeyModel;
    constructor(apiKeyModel: Model<ApiKeyDocument>);
    private generateKey;
    create(orgId: string, userId: string, dto: CreateApiKeyDto): Promise<{
        key: string;
        organization: Types.ObjectId;
        createdBy: Types.ObjectId;
        name: string;
        keyPrefix: string;
        isActive: boolean;
        scopes: string[];
        lastUsedAt?: Date;
        expiresAt?: Date;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    findAll(orgId: string): Promise<ApiKeyDocument[]>;
    revoke(id: string, orgId: string): Promise<ApiKeyDocument>;
    remove(id: string, orgId: string): Promise<void>;
    validateKey(rawKey: string): Promise<ApiKeyDocument | null>;
}
