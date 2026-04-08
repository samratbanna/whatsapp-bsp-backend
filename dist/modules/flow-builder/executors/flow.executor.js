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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FlowExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowExecutor = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = __importDefault(require("axios"));
const flow_schema_1 = require("../schemas/flow.schema");
const meta_api_service_1 = require("../../../common/services/meta-api.service");
const waba_service_1 = require("../../waba/waba.service");
let FlowExecutor = FlowExecutor_1 = class FlowExecutor {
    flowModel;
    sessionModel;
    metaApi;
    wabaService;
    logger = new common_1.Logger(FlowExecutor_1.name);
    constructor(flowModel, sessionModel, metaApi, wabaService) {
        this.flowModel = flowModel;
        this.sessionModel = sessionModel;
        this.metaApi = metaApi;
        this.wabaService = wabaService;
    }
    async processInbound(orgId, wabaDbId, message) {
        const phone = message.from;
        const text = message.text?.body || '';
        let session = await this.sessionModel.findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
            phone,
            isActive: true,
        }).populate('flow');
        if (session) {
            await this.continueFlow(session, message, orgId, wabaDbId);
            return;
        }
        const flow = await this.findMatchingFlow(orgId, text);
        if (!flow)
            return;
        const triggerNode = flow.nodes.find((n) => n.type === flow_schema_1.NodeType.TRIGGER);
        if (!triggerNode)
            return;
        session = await this.sessionModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            phone,
            flow: flow._id,
            currentNodeId: triggerNode.next || triggerNode.id,
            variables: { contact_phone: phone },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        await this.flowModel.findByIdAndUpdate(flow._id, { $inc: { triggerCount: 1 } });
        await this.executeFromNode(session, flow, message, orgId, wabaDbId);
    }
    async continueFlow(session, message, orgId, wabaDbId) {
        const flow = session.flow;
        const currentNode = flow.nodes.find((n) => n.id === session.currentNodeId);
        if (!currentNode) {
            await this.endSession(session);
            return;
        }
        if (currentNode.data?.captureInput) {
            const varName = currentNode.data.variableName || 'last_input';
            session.variables[varName] = message.text?.body || '';
            await session.save();
        }
        await this.executeFromNode(session, flow, message, orgId, wabaDbId);
    }
    async executeFromNode(session, flow, message, orgId, wabaDbId) {
        const waba = await this.wabaService.findOne(wabaDbId, orgId);
        let nodeId = session.currentNodeId;
        const maxSteps = 20;
        let steps = 0;
        while (nodeId && steps < maxSteps) {
            const node = flow.nodes.find((n) => n.id === nodeId);
            if (!node)
                break;
            steps++;
            try {
                const result = await this.executeNode(node, session, waba, message);
                if (result === 'end' || node.type === flow_schema_1.NodeType.END) {
                    await this.endSession(session);
                    await this.flowModel.findByIdAndUpdate(flow._id, { $inc: { completionCount: 1 } });
                    break;
                }
                if (result === 'wait') {
                    session.currentNodeId = nodeId;
                    await session.save();
                    break;
                }
                if (result === 'reset') {
                    await this.endSession(session);
                    break;
                }
                nodeId = result || node.next || '';
                session.currentNodeId = nodeId;
                await session.save();
            }
            catch (err) {
                this.logger.error(`Flow node error [${node.type}]: ${err.message}`);
                break;
            }
        }
    }
    async executeNode(node, session, waba, message) {
        switch (node.type) {
            case flow_schema_1.NodeType.TRIGGER:
                return node.next || 'end';
            case flow_schema_1.NodeType.SEND_TEXT: {
                const text = this.interpolate(node.data.text || '', session.variables);
                await this.metaApi.sendMessage(waba.phoneNumberId, waba.accessToken, {
                    to: session.phone,
                    type: 'text',
                    text: { body: text },
                });
                return node.next || 'end';
            }
            case flow_schema_1.NodeType.SEND_TEMPLATE: {
                await this.metaApi.sendMessage(waba.phoneNumberId, waba.accessToken, {
                    to: session.phone,
                    type: 'template',
                    template: {
                        name: node.data.templateName,
                        language: { code: node.data.languageCode || 'en_US' },
                        components: node.data.components || [],
                    },
                });
                return node.next || 'end';
            }
            case flow_schema_1.NodeType.CONDITION: {
                const inputVal = (session.variables[node.data.variable] || message.text?.body || '').toLowerCase().trim();
                for (const branch of node.branches || []) {
                    const condition = branch.condition.toLowerCase().trim();
                    if (condition === inputVal ||
                        inputVal.includes(condition) ||
                        (node.data.matchType === 'contains' && inputVal.includes(condition))) {
                        return branch.next;
                    }
                }
                return node.next || 'end';
            }
            case flow_schema_1.NodeType.SET_VARIABLE: {
                const val = this.interpolate(node.data.value || '', session.variables);
                session.variables[node.data.name] = val;
                await session.save();
                return node.next || 'end';
            }
            case flow_schema_1.NodeType.API_REQUEST: {
                try {
                    const url = this.interpolate(node.data.url, session.variables);
                    const method = (node.data.method || 'GET').toLowerCase();
                    const body = node.data.body
                        ? JSON.parse(this.interpolate(JSON.stringify(node.data.body), session.variables))
                        : undefined;
                    const response = await (0, axios_1.default)({ method, url, data: body, timeout: 10000 });
                    if (node.data.responseMapping) {
                        for (const [varName, path] of Object.entries(node.data.responseMapping)) {
                            const parts = path.split('.');
                            let val = response.data;
                            for (const part of parts)
                                val = val?.[part];
                            if (val !== undefined)
                                session.variables[varName] = String(val);
                        }
                        await session.save();
                    }
                }
                catch (err) {
                    this.logger.warn(`API request node failed: ${err.message}`);
                    if (node.data.onError === 'continue')
                        return node.next || 'end';
                    return 'end';
                }
                return node.next || 'end';
            }
            case flow_schema_1.NodeType.DELAY: {
                const ms = (node.data.seconds || 1) * 1000;
                await new Promise((r) => setTimeout(r, Math.min(ms, 5000)));
                return node.next || 'end';
            }
            case flow_schema_1.NodeType.JUMP:
                return node.data.targetNodeId || 'end';
            case flow_schema_1.NodeType.RESET_FLOW:
                return 'reset';
            case flow_schema_1.NodeType.END:
                return 'end';
            default:
                return node.next || 'end';
        }
    }
    async findMatchingFlow(orgId, text) {
        const flows = await this.flowModel
            .find({ organization: new mongoose_2.Types.ObjectId(orgId), status: 'active' })
            .sort({ priority: -1 })
            .exec();
        for (const flow of flows) {
            const trigger = flow.trigger;
            if (trigger.type === 'any_message')
                return flow;
            if (trigger.type === 'keyword' && trigger.keywords?.length) {
                const input = trigger.caseSensitive ? text : text.toLowerCase();
                const match = trigger.keywords.some((kw) => {
                    const k = trigger.caseSensitive ? kw : kw.toLowerCase();
                    return input === k || input.startsWith(k);
                });
                if (match)
                    return flow;
            }
        }
        return null;
    }
    async endSession(session) {
        session.isActive = false;
        await session.save();
    }
    interpolate(template, vars) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
    }
};
exports.FlowExecutor = FlowExecutor;
exports.FlowExecutor = FlowExecutor = FlowExecutor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(flow_schema_1.Flow.name)),
    __param(1, (0, mongoose_1.InjectModel)(flow_schema_1.FlowSession.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        meta_api_service_1.MetaApiService,
        waba_service_1.WabaService])
], FlowExecutor);
//# sourceMappingURL=flow.executor.js.map