import { FlowStatus } from '../schemas/flow.schema';
export declare class FlowTriggerDto {
    type: string;
    keywords?: string[];
    caseSensitive?: boolean;
}
export declare class FlowNodeDto {
    id: string;
    type: string;
    label?: string;
    position?: {
        x: number;
        y: number;
    };
    data: Record<string, any>;
    next?: string;
    branches?: {
        condition: string;
        next: string;
    }[];
}
export declare class CreateFlowDto {
    name: string;
    description?: string;
    trigger: FlowTriggerDto;
    nodes: FlowNodeDto[];
    priority?: number;
    wabaId?: string;
}
declare const UpdateFlowDto_base: import("@nestjs/common").Type<Partial<CreateFlowDto>>;
export declare class UpdateFlowDto extends UpdateFlowDto_base {
    status?: FlowStatus;
}
export {};
