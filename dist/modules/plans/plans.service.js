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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const plan_schema_1 = require("./schemas/plan.schema");
const enums_1 = require("../../common/enums");
let PlansService = class PlansService {
    planModel;
    constructor(planModel) {
        this.planModel = planModel;
    }
    async create(dto) {
        if (dto.isDefault) {
            await this.planModel.updateMany({}, { isDefault: false });
        }
        const plan = new this.planModel(dto);
        return plan.save();
    }
    async findAll(status) {
        const filter = status ? { status } : {};
        return this.planModel.find(filter).sort({ price: 1 }).exec();
    }
    async findOne(id) {
        const plan = await this.planModel.findById(id).exec();
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
    async findDefault() {
        return this.planModel.findOne({ isDefault: true, status: enums_1.PlanStatus.ACTIVE }).exec();
    }
    async update(id, dto) {
        if (dto.isDefault) {
            await this.planModel.updateMany({ _id: { $ne: id } }, { isDefault: false });
        }
        const plan = await this.planModel
            .findByIdAndUpdate(id, dto, { new: true })
            .exec();
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        return plan;
    }
    async remove(id) {
        const plan = await this.planModel.findById(id);
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        if (plan.isDefault) {
            throw new common_1.BadRequestException('Cannot delete the default plan');
        }
        await plan.deleteOne();
    }
    async seed() {
        const count = await this.planModel.countDocuments();
        if (count > 0)
            return;
        await this.planModel.insertMany([
            {
                name: 'Free',
                type: 'free',
                price: 0,
                isDefault: true,
                monthlyMessageLimit: 500,
                agentLimit: 1,
                wabaLimit: 1,
                templateLimit: 3,
                broadcastLimit: 1,
                flowBuilderAccess: false,
                apiAccess: false,
                webhookAccess: false,
                aiChatbotAccess: false,
                trialDays: 0,
                description: 'Get started for free',
                features: ['500 messages/month', '1 agent', '3 templates', '1 WABA'],
            },
            {
                name: 'Starter',
                type: 'starter',
                price: 999,
                monthlyMessageLimit: 5000,
                agentLimit: 3,
                wabaLimit: 1,
                templateLimit: 20,
                broadcastLimit: 5,
                flowBuilderAccess: true,
                apiAccess: true,
                webhookAccess: false,
                aiChatbotAccess: false,
                trialDays: 14,
                description: 'Perfect for small businesses',
                features: ['5000 messages/month', '3 agents', '20 templates', 'Flow builder', 'API access'],
            },
            {
                name: 'Pro',
                type: 'pro',
                price: 2999,
                monthlyMessageLimit: 25000,
                agentLimit: 10,
                wabaLimit: 3,
                templateLimit: 100,
                broadcastLimit: 20,
                flowBuilderAccess: true,
                apiAccess: true,
                webhookAccess: true,
                aiChatbotAccess: true,
                trialDays: 14,
                description: 'For growing businesses',
                features: ['25000 messages/month', '10 agents', '3 WABAs', 'Webhooks', 'AI Chatbot'],
            },
            {
                name: 'Enterprise',
                type: 'enterprise',
                price: 9999,
                monthlyMessageLimit: -1,
                agentLimit: -1,
                wabaLimit: -1,
                templateLimit: -1,
                broadcastLimit: -1,
                flowBuilderAccess: true,
                apiAccess: true,
                webhookAccess: true,
                aiChatbotAccess: true,
                trialDays: 30,
                description: 'Unlimited everything',
                features: ['Unlimited messages', 'Unlimited agents', 'Unlimited WABAs', 'Priority support'],
            },
        ]);
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(plan_schema_1.Plan.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PlansService);
//# sourceMappingURL=plans.service.js.map