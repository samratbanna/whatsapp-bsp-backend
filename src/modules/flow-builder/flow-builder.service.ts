import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Flow, FlowDocument, FlowSession, FlowSessionDocument, FlowStatus } from './schemas/flow.schema';
import { CreateFlowDto, UpdateFlowDto } from './dto/flow.dto';
import { WabaService } from '../waba/waba.service';

@Injectable()
export class FlowBuilderService {
  constructor(
    @InjectModel(Flow.name) private flowModel: Model<FlowDocument>,
    @InjectModel(FlowSession.name) private sessionModel: Model<FlowSessionDocument>,
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
      nodes: dto.nodes as any[],
      priority: dto.priority || 0,
      status: 'draft',
    });
  }

  async findAll(orgId: string, status?: string): Promise<FlowDocument[]> {
    const filter: any = { organization: new Types.ObjectId(orgId) };
    if (status) filter.status = status;
    return this.flowModel.find(filter).populate('waba', 'displayPhoneNumber').sort({ priority: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string, orgId: string): Promise<FlowDocument> {
    const flow = await this.flowModel.findOne({ _id: id, organization: new Types.ObjectId(orgId) }).exec();
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  async update(id: string, orgId: string, dto: UpdateFlowDto): Promise<FlowDocument> {
    const flow = await this.flowModel
      .findOneAndUpdate({ _id: id, organization: new Types.ObjectId(orgId) }, { $set: dto }, { new: true })
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
    const flow = await this.flowModel.findOne({ _id: id, organization: new Types.ObjectId(orgId) });
    if (!flow) throw new NotFoundException('Flow not found');
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
}
