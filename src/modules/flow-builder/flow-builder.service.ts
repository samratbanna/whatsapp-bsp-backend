import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Flow, FlowDocument, FlowSession, FlowSessionDocument, FlowLog, FlowLogDocument, FlowStatus } from './schemas/flow.schema';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';
import { WabaService } from '../waba/waba.service';

@Injectable()
export class FlowBuilderService {
  constructor(
    @InjectModel(Flow.name) private flowModel: Model<FlowDocument>,
    @InjectModel(FlowSession.name) private sessionModel: Model<FlowSessionDocument>,
    @InjectModel(FlowLog.name) private logModel: Model<FlowLogDocument>,
    private wabaService: WabaService,
  ) {}

  async create(orgId: string, dto: CreateFlowDto): Promise<FlowDocument> {
    const waba = dto.wabaId
      ? await this.wabaService.findOne(dto.wabaId, orgId)
      : await this.wabaService.findDefaultForOrg(orgId);
    if (!waba) throw new BadRequestException('No active WABA found');

    return this.flowModel.create({
      organization: new Types.ObjectId(orgId),
      waba: waba._id,
      name: dto.name,
      description: dto.description,
      trigger: dto.trigger as any,
      nodes: dto.nodes as any[] || [],
      edges: dto.edges as any[] || [],
      priority: dto.priority || 0,
      repeatPolicy: dto.repeatPolicy || 'once',
      cooldownDays: dto.cooldownDays || 0,
      status: 'draft',
    });
  }

  async findAll(orgId: string, status?: string): Promise<FlowDocument[]> {
    const filter: any = {};
    if (orgId) filter.organization = new Types.ObjectId(orgId);
    if (status) filter.status = status;
    return this.flowModel.find(filter).populate('waba', 'displayPhoneNumber').sort({ priority: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string, orgId?: string): Promise<FlowDocument> {
    const filter: any = { _id: id };
    if (orgId) filter.organization = new Types.ObjectId(orgId);
    const flow = await this.flowModel.findOne(filter).exec();
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  async update(id: string, orgId: string, dto: UpdateFlowDto): Promise<FlowDocument> {
    const filter: any = { _id: id };
    if (orgId) filter.organization = new Types.ObjectId(orgId);
    const flow = await this.flowModel
      .findOneAndUpdate(filter, { $set: dto }, { new: true })
      .exec();
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  async activate(id: string, orgId: string): Promise<FlowDocument> {
    return this.update(id, orgId, { status: FlowStatus.ACTIVE });
  }

  async deactivate(id: string, orgId: string): Promise<FlowDocument> {
    return this.update(id, orgId, { status: FlowStatus.INACTIVE });
  }

  async remove(id: string, orgId: string): Promise<void> {
    const flow = await this.findOne(id, orgId);
    await this.sessionModel.deleteMany({ flow: flow._id });
    await flow.deleteOne();
  }

  async duplicate(id: string, orgId: string): Promise<FlowDocument> {
    const flow = await this.findOne(id, orgId);
    const obj = flow.toObject();
    delete (obj as any)._id;
    delete (obj as any).createdAt;
    delete (obj as any).updatedAt;
    obj.name = `${obj.name} (Copy)`;
    obj.status = FlowStatus.DRAFT;
    obj.triggerCount = 0;
    obj.completionCount = 0;
    return this.flowModel.create(obj);
  }

  async getActiveSessions(orgId: string) {
    return this.sessionModel
      .find({ organization: new Types.ObjectId(orgId), isActive: true })
      .populate('flow', 'name')
      .sort({ updatedAt: -1 })
      .limit(100)
      .exec();
  }

  async clearSession(orgId: string, phone: string): Promise<{ cleared: number }> {
    const result = await this.sessionModel.updateMany(
      { organization: new Types.ObjectId(orgId), phone, isActive: true },
      { $set: { isActive: false } },
    );
    return { cleared: result.modifiedCount };
  }

  // ── Flow Dashboard ────────────────────────────────────────────────

  async getFlowSessions(
    flowId: string,
    orgId: string,
    page = 1,
    limit = 20,
  ) {
    const filter = {
      organization: new Types.ObjectId(orgId),
      flow: new Types.ObjectId(flowId),
    };
    const [sessions, total] = await Promise.all([
      this.sessionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v')
        .exec(),
      this.sessionModel.countDocuments(filter),
    ]);
    return { sessions, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getSessionLogs(sessionId: string, orgId: string) {
    const session = await this.sessionModel
      .findOne({ _id: sessionId, organization: new Types.ObjectId(orgId) })
      .select('-__v')
      .exec();
    if (!session) throw new NotFoundException('Session not found');

    const logs = await this.logModel
      .find({ session: new Types.ObjectId(sessionId) })
      .sort({ timestamp: 1 })
      .select('-__v')
      .exec();

    return { session, logs };
  }

  async getFlowStats(flowId: string, orgId: string) {
    const flow = await this.findOne(flowId, orgId);
    const filter = { organization: new Types.ObjectId(orgId), flow: new Types.ObjectId(flowId) };

    const [total, active, completed] = await Promise.all([
      this.sessionModel.countDocuments(filter),
      this.sessionModel.countDocuments({ ...filter, isActive: true }),
      this.sessionModel.countDocuments({ ...filter, isActive: false }),
    ]);

    return {
      flowId,
      name: flow.name,
      status: flow.status,
      triggerCount: flow.triggerCount,
      completionCount: flow.completionCount,
      sessions: { total, active, completed },
    };
  }
}
