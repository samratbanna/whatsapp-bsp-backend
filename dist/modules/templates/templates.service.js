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
var TemplatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const template_schema_1 = require("./schemas/template.schema");
const waba_service_1 = require("../waba/waba.service");
const meta_api_service_1 = require("../../common/services/meta-api.service");
let TemplatesService = TemplatesService_1 = class TemplatesService {
    templateModel;
    wabaService;
    metaApi;
    logger = new common_1.Logger(TemplatesService_1.name);
    constructor(templateModel, wabaService, metaApi) {
        this.templateModel = templateModel;
        this.wabaService = wabaService;
        this.metaApi = metaApi;
    }
    extractVariables(components) {
        const vars = new Set();
        const regex = /\{\{(\d+)\}\}/g;
        for (const comp of components) {
            const text = comp.text || '';
            let match;
            while ((match = regex.exec(text)) !== null) {
                vars.add(`{{${match[1]}}}`);
            }
        }
        return Array.from(vars);
    }
    async create(orgId, dto) {
        const waba = dto.wabaId
            ? await this.wabaService.findOne(dto.wabaId, orgId)
            : await this.wabaService.findDefaultForOrg(orgId);
        if (!waba)
            throw new common_1.BadRequestException('No active WABA found');
        const existing = await this.templateModel.findOne({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: waba._id,
            name: dto.name,
        });
        if (existing)
            throw new common_1.BadRequestException('Template with this name already exists');
        let metaTemplateId;
        try {
            const metaRes = await this.metaApi.createTemplate(waba.wabaId, waba.accessToken, {
                name: dto.name,
                category: dto.category,
                language: dto.language,
                components: dto.components,
            });
            metaTemplateId = metaRes.id;
        }
        catch (err) {
            this.logger.error('Meta template creation failed', err.message);
            throw err;
        }
        return this.templateModel.create({
            organization: new mongoose_2.Types.ObjectId(orgId),
            waba: waba._id,
            metaTemplateId,
            name: dto.name,
            category: dto.category,
            language: dto.language,
            components: dto.components,
            variables: this.extractVariables(dto.components),
            status: template_schema_1.TemplateStatus.PENDING,
        });
    }
    async syncFromMeta(orgId, wabaId) {
        const waba = wabaId
            ? await this.wabaService.findOne(wabaId, orgId)
            : await this.wabaService.findDefaultForOrg(orgId);
        if (!waba)
            throw new common_1.BadRequestException('No active WABA found');
        const metaTemplates = await this.metaApi.getTemplates(waba.wabaId, waba.accessToken);
        let synced = 0;
        for (const mt of metaTemplates) {
            await this.templateModel.findOneAndUpdate({
                organization: new mongoose_2.Types.ObjectId(orgId),
                waba: waba._id,
                name: mt.name,
            }, {
                $set: {
                    metaTemplateId: mt.id,
                    category: mt.category,
                    language: mt.language,
                    status: mt.status,
                    components: mt.components || [],
                    variables: this.extractVariables(mt.components || []),
                    rejectedReason: mt.rejected_reason,
                    lastSyncedAt: new Date(),
                },
            }, { upsert: true, new: true });
            synced++;
        }
        return { synced };
    }
    async findAll(orgId, query) {
        const filter = { organization: new mongoose_2.Types.ObjectId(orgId) };
        if (query.wabaId)
            filter.waba = new mongoose_2.Types.ObjectId(query.wabaId);
        if (query.status)
            filter.status = query.status.toUpperCase();
        if (query.category)
            filter.category = query.category.toUpperCase();
        if (query.search)
            filter.name = { $regex: query.search, $options: 'i' };
        return this.templateModel
            .find(filter)
            .populate('waba', 'displayPhoneNumber verifiedName')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findOne(id, orgId) {
        const template = await this.templateModel
            .findOne({ _id: id, organization: new mongoose_2.Types.ObjectId(orgId) })
            .populate('waba', 'displayPhoneNumber verifiedName')
            .exec();
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        return template;
    }
    async remove(id, orgId) {
        const template = await this.findOne(id, orgId);
        const waba = await this.wabaService.findOne(template.waba.toString(), orgId);
        try {
            await this.metaApi.deleteTemplate(waba.wabaId, waba.accessToken, template.name);
        }
        catch (err) {
            this.logger.warn(`Meta delete template failed: ${err.message} — removing locally anyway`);
        }
        await template.deleteOne();
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = TemplatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(template_schema_1.Template.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        waba_service_1.WabaService,
        meta_api_service_1.MetaApiService])
], TemplatesService);
//# sourceMappingURL=templates.service.js.map