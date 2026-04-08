import { PlanStatus, PlanType } from '../../../common/enums';
export declare class CreatePlanDto {
    name: string;
    type: PlanType;
    price: number;
    isDefault?: boolean;
    monthlyMessageLimit?: number;
    agentLimit?: number;
    wabaLimit?: number;
    templateLimit?: number;
    broadcastLimit?: number;
    flowBuilderAccess?: boolean;
    apiAccess?: boolean;
    webhookAccess?: boolean;
    aiChatbotAccess?: boolean;
    trialDays?: number;
    description?: string;
    features?: string[];
}
declare const UpdatePlanDto_base: import("@nestjs/common").Type<Partial<CreatePlanDto>>;
export declare class UpdatePlanDto extends UpdatePlanDto_base {
    status?: PlanStatus;
}
export {};
