import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument, WalletTransaction, WalletTransactionDocument, WalletCategory } from './schemas/wallet.schema';
import { AddCreditsDto, BulkAddCreditsDto, UpdateWalletSettingsDto, WalletTxQueryDto } from './dto/wallet.dto';
export declare class WalletService {
    private walletModel;
    private txModel;
    private readonly logger;
    constructor(walletModel: Model<WalletDocument>, txModel: Model<WalletTransactionDocument>);
    getOrCreate(orgId: string): Promise<WalletDocument>;
    initializeForOrg(orgId: string): Promise<WalletDocument>;
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
    addCredits(orgId: string, dto: AddCreditsDto, adminId: string): Promise<{
        wallet: WalletDocument;
        transaction: WalletTransactionDocument;
    }>;
    bulkAddCredits(orgId: string, dto: BulkAddCreditsDto, adminId: string): Promise<WalletDocument>;
    deductCredit(orgId: string, category: WalletCategory, messageId?: string, campaignId?: string, metaMessageId?: string): Promise<void>;
    refundCredit(orgId: string, metaMessageId: string, failureReason: string): Promise<void>;
    updateSettings(orgId: string, dto: UpdateWalletSettingsDto): Promise<WalletDocument>;
    getTransactions(orgId: string, query: WalletTxQueryDto): Promise<{
        data: (import("mongoose").Document<unknown, {}, WalletTransactionDocument, {}, import("mongoose").DefaultSchemaOptions> & WalletTransaction & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
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
    getUsageSummary(orgId: string): Promise<{
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
    getAllWallets(): Promise<(import("mongoose").Document<unknown, {}, WalletDocument, {}, import("mongoose").DefaultSchemaOptions> & Wallet & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static toWalletCategory(metaCategory: string): WalletCategory;
}
