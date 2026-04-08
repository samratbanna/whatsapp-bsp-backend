"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowBuilderService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const flow_schema_1 = require("./schemas/flow.schema");
const waba_service_1 = require("../waba/waba.service");
let FlowBuilderService = class FlowBuilderService {
    flowModel;
    sessionModel;
    wabaService;
    constructor(flowModel, sessionModel, wabaService) {
        this.flowModel = flowModel;
        this.sessionModel = sessionModel;
        this.wabaService = wabaService;
    }
    async create(orgId, dto) {
        const waba = dto.wabaId
            ? await this.wabaService.findOne(dto.wabaId, orgId)
            : await this.wabaService.findDefaultForOrg(orgId);
        if (!waba)
            throw new common_1.BadRequestException('No active WABA found');
        return this.flowModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: waba._id,
            name: dto.name,
            description: dto.description,
            trigger: dto.trigger,
            nodes: dto.nodes,
            priority: dto.priority || 0,
            status: 'draft',
        });
    }
    async findAll(orgId, status) {
        const filter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        if (status)
            filter.status = status;
        return this.flowModel.find(filter).populate('waba', 'displayPhoneNumber').sort({ priority: -1, createdAt: -1 }).exec();
    }
    async findOne(id, orgId) {
        const flow = await this.flowModel.findOne({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) }).exec();
        if (!flow)
            throw new common_1.NotFoundException('Flow not found');
        return flow;
    }
    async update(id, orgId, dto) {
        const flow = await this.flowModel
            .findOneAndUpdate({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) }, { $set: dto }, { new: true })
            .exec();
        if (!flow)
            throw new common_1.NotFoundException('Flow not found');
        return flow;
    }
    async activate(id, orgId) {
        return this.update(id, orgId, { status: flow_schema_1.FlowStatus.ACTIVE });
    }
    async deactivate(id, orgId) {
        return this.update(id, orgId, { status: flow_schema_1.FlowStatus.INACTIVE });
    }
    async remove(id, orgId) {
        const flow = await this.flowModel.findOne({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) });
        if (!flow)
            throw new common_1.NotFoundException('Flow not found');
        await this.sessionModel.deleteMany({ flow: flow._id });
        await flow.deleteOne();
    }
    async duplicate(id, orgId) {
        const flow = await this.findOne(id, orgId);
        const obj = flow.toObject();
        delete obj._id;
        delete obj.createdAt;
        delete obj.updatedAt;
        obj.name = `${obj.name} (Copy)`;
        obj.status = flow_schema_1.FlowStatus.DRAFT;
        obj.triggerCount = 0;
        obj.completionCount = 0;
        return this.flowModel.create(obj);
    }
    async getActiveSessions(orgId) {
        return this.sessionModel
            .find({ organization: new mongoose_2.Types.ObjectId(orgId), isActive: true })
            .populate('flow', 'name')
            .sort({ updatedAt: -1 })
            .limit(100)
            .exec();
    }
};
exports.FlowBuilderService = FlowBuilderService;
exports.FlowBuilderService = FlowBuilderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(flow_schema_1.Flow.name)),
    __param(1, (0, mongoose_1.InjectModel)(flow_schema_1.FlowSession.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        waba_service_1.WabaService])
], FlowBuilderService);
//# sourceMappingURL=flow-builder.service.js.map