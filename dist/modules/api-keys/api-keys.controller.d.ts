import { ApiKeysService, CreateApiKeyDto } from './api-keys.service';
export declare class ApiKeysController {
    private readonly apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    create(orgId: string, userId: string, dto: CreateApiKeyDto): Promise<{
        key: string;
        organization: import("mongoose").Types.ObjectId;
        createdBy: import("mongoose").Types.ObjectId;
        name: string;
        keyPrefix: string;
        isActive: boolean;
        scopes: string[];
        lastUsedAt?: Date;
        expiresAt?: Date;
        _id: import("mongoose").Types.ObjectId;
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
    findAll(orgId: string): Promise<import("./schemas/api-key.schema").ApiKeyDocument[]>;
    revoke(id: string, orgId: string): Promise<import("./schemas/api-key.schema").ApiKeyDocument>;
    remove(id: string, orgId: string): Promise<void>;
}
