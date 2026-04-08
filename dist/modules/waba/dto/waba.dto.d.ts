import { WabaOwnershipType } from '../schemas/waba.schema';
export declare class ConnectWabaDto {
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
    ownershipType?: WabaOwnershipType;
    label?: string;
    poolLabel?: string;
    isDefault?: boolean;
    walletBillingEnabled?: boolean;
}
export declare class UpdateWabaDto {
    accessToken?: string;
    label?: string;
    isDefault?: boolean;
    walletBillingEnabled?: boolean;
}
export declare class AssignSharedWabaDto {
    orgId: string;
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
    label?: string;
    poolLabel?: string;
}
