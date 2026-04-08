"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const user_schema_1 = require("./schemas/user.schema");
const enums_1 = require("../../common/enums");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(dto) {
        const existing = await this.userModel.findOne({ email: dto.email });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const hashed = await bcrypt.hash(dto.password, 12);
        const user = new this.userModel({
            ...dto,
            password: hashed,
            organization: dto.organizationId
                ? new mongoose_2.Types.ObjectId(dto.organizationId)
                : null,
        });
        return user.save();
    }
    async findAll(orgId, status) {
        const filter = {};
        if (orgId)
            filter.organization = new mongoose_2.Types.ObjectId(orgId);
        if (status)
            filter.status = status;
        return this.userModel
            .find(filter)
            .populate('organization', 'name slug status')
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findOne(id) {
        const user = await this.userModel
            .findById(id)
            .populate('organization', 'name slug status plan')
            .select('-password -refreshToken')
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findByEmail(email, includePassword = false) {
        const query = this.userModel
            .findOne({ email: email.toLowerCase() })
            .populate('organization');
        if (includePassword)
            query.select('+password +refreshToken');
        return query.exec();
    }
    async update(id, dto) {
        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 12);
        }
        const user = await this.userModel
            .findByIdAndUpdate(id, dto, { new: true })
            .populate('organization', 'name slug')
            .select('-password -refreshToken')
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async changePassword(id, dto) {
        const user = await this.userModel.findById(id).select('+password').exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch)
            throw new common_1.BadRequestException('Current password is incorrect');
        user.password = await bcrypt.hash(dto.newPassword, 12);
        await user.save();
    }
    async suspend(id) {
        return this.update(id, { status: enums_1.UserStatus.SUSPENDED });
    }
    async activate(id) {
        return this.update(id, { status: enums_1.UserStatus.ACTIVE });
    }
    async updateRefreshToken(id, token) {
        const hashed = token ? await bcrypt.hash(token, 10) : null;
        await this.userModel.findByIdAndUpdate(id, { refreshToken: hashed });
    }
    async updateLastLogin(id) {
        await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
    }
    async validateRefreshToken(id, token) {
        const user = await this.userModel.findById(id).select('+refreshToken').exec();
        if (!user?.refreshToken)
            return false;
        return bcrypt.compare(token, user.refreshToken);
    }
    async remove(id) {
        const user = await this.userModel.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await user.deleteOne();
    }
    async seedSuperAdmin(email, password) {
        const exists = await this.userModel.findOne({ role: enums_1.Role.SUPER_ADMIN });
        if (exists)
            return;
        const hashed = await bcrypt.hash(password, 12);
        await this.userModel.create({
            name: 'Super Admin',
            email,
            password: hashed,
            role: enums_1.Role.SUPER_ADMIN,
            status: enums_1.UserStatus.ACTIVE,
            organization: null,
        });
        console.log(`✅ Super admin seeded: ${email}`);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map