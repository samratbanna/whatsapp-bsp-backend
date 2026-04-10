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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const organization_schema_1 = require("./schemas/organization.schema");
const wallet_service_1 = require("../wallet/wallet.service");
const enums_1 = require("../../common/enums");
const users_service_1 = require("../users/users.service");
let OrganizationsService = class OrganizationsService {
    orgModel;
    walletService;
    usersService;
    constructor(orgModel, walletService, usersService) {
        this.orgModel = orgModel;
        this.walletService = walletService;
        this.usersService = usersService;
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    async create(dto, options = {}) {
        const { createAdminUser = true } = options;
        if (createAdminUser && (!dto.ownerEmail || !dto.ownerPassword)) {
            throw new common_1.BadRequestException('ownerEmail and ownerPassword are required while creating organization');
        }
        const ownerEmail = dto.ownerEmail;
        const ownerPassword = dto.ownerPassword;
        const slug = dto.slug || this.generateSlug(dto.name);
        const existing = await this.orgModel.findOne({ slug });
        if (existing)
            throw new common_1.ConflictException('Organization slug already taken');
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const org = new this.orgModel({
            ...dto,
            slug,
            trialEndsAt,
            timezone: dto.timezone || 'Asia/Kolkata',
        });
        const saved = await org.save();
        if (createAdminUser) {
            try {
                await this.usersService.create({
                    name: dto.ownerName || `${dto.name} Admin`,
                    email: ownerEmail,
                    password: ownerPassword,
                    role: enums_1.Role.ORG_ADMIN,
                    permissions: enums_1.ALL_FEATURE_PERMISSIONS,
                    organizationId: saved._id.toString(),
                    phone: dto.contact,
                });
            }
            catch (error) {
                await saved.deleteOne();
                throw error;
            }
        }
        await this.walletService.initializeForOrg(saved._id.toString());
        return saved;
    }
    async findAll(status) {
        const filter = status ? { status } : {};
        return this.orgModel
            .find(filter)
            .sort({ createdAt: -1 })
            .exec();
    }
    async findOne(id) {
        const org = await this.orgModel
            .findById(id)
            .exec();
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        return org;
    }
    async findBySlug(slug) {
        const org = await this.orgModel.findOne({ slug }).exec();
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        return org;
    }
    async update(id, dto) {
        const org = await this.orgModel
            .findByIdAndUpdate(id, dto, { new: true })
            .exec();
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        return org;
    }
    async suspend(id) {
        return this.update(id, { status: enums_1.OrgStatus.SUSPENDED });
    }
    async activate(id) {
        return this.update(id, { status: enums_1.OrgStatus.ACTIVE });
    }
    async incrementMessageUsage(orgId, count = 1) {
        await this.orgModel.findByIdAndUpdate(orgId, {
            $inc: { messagesUsedThisMonth: count },
        });
    }
    async resetMonthlyUsage() {
        await this.orgModel.updateMany({}, { messagesUsedThisMonth: 0, usageResetAt: new Date() });
    }
    async remove(id) {
        const org = await this.orgModel.findById(id);
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        await org.deleteOne();
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        wallet_service_1.WalletService,
        users_service_1.UsersService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map