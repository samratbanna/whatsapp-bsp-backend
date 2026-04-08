import { Model } from 'mongoose';
import { PlanDocument } from './schemas/plan.schema';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { PlanStatus } from '../../common/enums';
export declare class PlansService {
    private planModel;
    constructor(planModel: Model<PlanDocument>);
    create(dto: CreatePlanDto): Promise<PlanDocument>;
    findAll(status?: PlanStatus): Promise<PlanDocument[]>;
    findOne(id: string): Promise<PlanDocument>;
    findDefault(): Promise<PlanDocument | null>;
    update(id: string, dto: UpdatePlanDto): Promise<PlanDocument>;
    remove(id: string): Promise<void>;
    seed(): Promise<void>;
}
