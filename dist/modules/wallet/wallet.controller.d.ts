import { WalletService } from './wallet.service';
import { AddCreditsDto, BulkAddCreditsDto, UpdateWalletSettingsDto, WalletTxQueryDto } from './dto/wallet.dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getMyWallet(orgId: string): Promise<import("./schemas/wallet.schema").WalletDocument>;
    getCredits(orgId: string): Promise<{
        transactional: number;
        promotional: number;
        authentication: number;
        blockOnEmpty: boolean;
        thresholds: {
            transactional: number;
            promotional: number;
            authentication: number;
        };
    }>;
    getSummary(orgId: string): Promise<{
        credits: {
            transactional: number;
            promotional: number;
            authentication: number;
        };
        lifetime: {
            transactionalAdded: number;
            promotionalAdded: number;
            authenticationAdded: number;
            transactionalUsed: number;
            promotionalUsed: number;
            authenticationUsed: number;
        };
        thisMonth: {
            transactional: number;
            promotional: number;
            authentication: number;
        };
    }>;
    getTransactions(orgId: string, query: WalletTxQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/wallet.schema").WalletTransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/wallet.schema").WalletTransaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    updateSettings(orgId: string, dto: UpdateWalletSettingsDto): Promise<import("./schemas/wallet.schema").WalletDocument>;
    getAllWallets(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/wallet.schema").WalletDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/wallet.schema").Wallet & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getOrgWallet(orgId: string): Promise<import("./schemas/wallet.schema").WalletDocument>;
    getOrgSummary(orgId: string): Promise<{
        credits: {
            transactional: number;
            promotional: number;
            authentication: number;
        };
        lifetime: {
            transactionalAdded: number;
            promotionalAdded: number;
            authenticationAdded: number;
            transactionalUsed: number;
            promotionalUsed: number;
            authenticationUsed: number;
        };
        thisMonth: {
            transactional: number;
            promotional: number;
            authentication: number;
        };
    }>;
    getOrgTransactions(orgId: string, query: WalletTxQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/wallet.schema").WalletTransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/wallet.schema").WalletTransaction & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    addCredits(orgId: string, dto: AddCreditsDto, adminId: string): Promise<{
        wallet: import("./schemas/wallet.schema").WalletDocument;
        transaction: import("./schemas/wallet.schema").WalletTransactionDocument;
    }>;
    bulkAddCredits(orgId: string, dto: BulkAddCreditsDto, adminId: string): Promise<import("./schemas/wallet.schema").WalletDocument>;
}
