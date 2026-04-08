import { PlanStatus } from '../../common/enums';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findPublic(status?: PlanStatus): Promise<import("./schemas/plan.schema").PlanDocument[]>;
    findAll(status?: PlanStatus): Promise<import("./schemas/plan.schema").PlanDocument[]>;
    findOne(id: string): Promise<import("./schemas/plan.schema").PlanDocument>;
    create(dto: CreatePlanDto): Promise<import("./schemas/plan.schema").PlanDocument>;
    update(id: string, dto: UpdatePlanDto): Promise<import("./schemas/plan.schema").PlanDocument>;
    remove(id: string): Promise<void>;
}
