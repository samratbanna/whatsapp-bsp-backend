import { WalletCategory, TransactionReason } from '../schemas/wallet.schema';
export declare class AddCreditsDto {
    category: WalletCategory;
    credits: number;
    reason: TransactionReason;
    description?: string;
}
export declare class BulkAddCreditsDto {
    transactional?: number;
    promotional?: number;
    authentication?: number;
    description?: string;
}
export declare class UpdateWalletSettingsDto {
    lowTransactionalThreshold?: number;
    lowPromotionalThreshold?: number;
    lowAuthenticationThreshold?: number;
    blockOnEmpty?: boolean;
}
export declare class WalletTxQueryDto {
    category?: WalletCategory;
    reason?: TransactionReason;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}
