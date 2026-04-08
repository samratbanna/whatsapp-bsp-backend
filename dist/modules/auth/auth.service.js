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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const users_service_1 = require("../users/users.service");
const organizations_service_1 = require("../organizations/organizations.service");
const enums_1 = require("../../common/enums");
let AuthService = class AuthService {
    usersService;
    orgsService;
    jwtService;
    config;
    constructor(usersService, orgsService, jwtService, config) {
        this.usersService = usersService;
        this.orgsService = orgsService;
        this.jwtService = jwtService;
        this.config = config;
    }
    async register(dto) {
        const org = await this.orgsService.create({
            name: dto.organizationName,
        });
        const user = await this.usersService.create({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            organizationId: org._id.toString(),
        });
        const tokens = await this.generateTokens(user);
        await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
        return {
            user: this.sanitizeUser(user),
            organization: org,
            ...tokens,
        };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email, true);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (user.status === enums_1.UserStatus.SUSPENDED) {
            throw new common_1.UnauthorizedException('Account suspended. Contact support.');
        }
        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatch)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const tokens = await this.generateTokens(user);
        await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
        await this.usersService.updateLastLogin(user._id.toString());
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async refresh(userId, refreshToken) {
        const isValid = await this.usersService.validateRefreshToken(userId, refreshToken);
        if (!isValid)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const user = await this.usersService.findOne(userId);
        if (user.status === enums_1.UserStatus.SUSPENDED) {
            throw new common_1.UnauthorizedException('Account suspended');
        }
        const tokens = await this.generateTokens(user);
        await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.usersService.updateRefreshToken(userId, null);
    }
    async generateTokens(user) {
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            orgId: user.organization?._id?.toString() || user.organization?.toString() || null,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.config.get('JWT_SECRET'),
                expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    sanitizeUser(user) {
        const obj = user.toObject ? user.toObject() : { ...user };
        delete obj.password;
        delete obj.refreshToken;
        delete obj.passwordResetToken;
        delete obj.passwordResetExpires;
        return obj;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        organizations_service_1.OrganizationsService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map