import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plan, PlanDocument, planAmounts } from './schemas/plan.schema';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  // ── Website (public) ───────────────────────────────────────────────
  async listPublic() {
    const plans = await this.planModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 })
      .exec();
    return plans.map((p) => this.present(p));
  }

  async getPublic(slugOrId: string) {
    const plan = await this.findActive(slugOrId);
    return this.present(plan);
  }

  /** Active plan by slug or id — what checkout is allowed to sell. */
  async findActive(slugOrId: string): Promise<PlanDocument> {
    const or: any[] = [{ slug: slugOrId.toLowerCase() }];
    if (Types.ObjectId.isValid(slugOrId))
      or.push({ _id: new Types.ObjectId(slugOrId) });
    const plan = await this.planModel
      .findOne({ $or: or, isActive: true })
      .exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  // ── Super admin ────────────────────────────────────────────────────
  async findAll() {
    const plans = await this.planModel
      .find()
      .sort({ sortOrder: 1, price: 1 })
      .exec();
    return plans.map((p) => this.present(p));
  }

  async findOne(id: string): Promise<PlanDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Plan not found');
    const plan = await this.planModel.findById(id).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(dto: CreatePlanDto) {
    assertHasCredits(dto);
    const slug = dto.slug || slugify(dto.name);
    if (await this.planModel.exists({ slug })) {
      throw new ConflictException(`A plan with slug "${slug}" already exists`);
    }
    const plan = await this.planModel.create({ ...dto, slug });
    return this.present(plan);
  }

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.findOne(id);
    if (
      dto.slug &&
      dto.slug !== plan.slug &&
      (await this.planModel.exists({ slug: dto.slug }))
    ) {
      throw new ConflictException(
        `A plan with slug "${dto.slug}" already exists`,
      );
    }
    Object.assign(plan, dto);
    assertHasCredits(plan);
    await plan.save();
    return this.present(plan);
  }

  /**
   * Plans are never hard-deleted: past orders point at them. "Delete" hides the plan from the
   * website and from checkout.
   */
  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }

  present(plan: PlanDocument) {
    const { subtotalPaise, gstPaise, totalPaise } = planAmounts(plan);
    return {
      id: plan._id.toString(),
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      credits: {
        transactional: plan.transactionalCredits,
        promotional: plan.promotionalCredits,
        authentication: plan.authenticationCredits,
        total:
          plan.transactionalCredits +
          plan.promotionalCredits +
          plan.authenticationCredits,
      },
      price: subtotalPaise / 100,
      gstPercent: plan.gstPercent,
      gstAmount: gstPaise / 100,
      totalPrice: totalPaise / 100,
      currency: 'INR',
      features: plan.features ?? [],
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
    };
  }
}

function assertHasCredits(p: {
  transactionalCredits?: number;
  promotionalCredits?: number;
  authenticationCredits?: number;
}) {
  const total =
    (p.transactionalCredits ?? 0) +
    (p.promotionalCredits ?? 0) +
    (p.authenticationCredits ?? 0);
  if (total < 1)
    throw new BadRequestException('A plan must include at least one credit');
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'plan'
  );
}
