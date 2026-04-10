import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  ALL_FEATURE_PERMISSIONS,
  Role,
  UserStatus,
} from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private orgsService: OrganizationsService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ── Register: creates org + org_admin user ─────────────────────────
  async register(dto: RegisterDto) {
    // Create org first
    const org = await this.orgsService.create({
      name: dto.organizationName,
    }, { createAdminUser: false });

    // Create org admin
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: Role.ORG_ADMIN,
      permissions: ALL_FEATURE_PERMISSIONS,
      organizationId: (org._id as any).toString(),
    });

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );

    return {
      user: this.sanitizeUser(user),
      organization: org,
      ...tokens,
    };
  }

  // ── Login ──────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email, true);

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended. Contact support.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );
    await this.usersService.updateLastLogin((user._id as any).toString());

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ── Refresh tokens ─────────────────────────────────────────────────
  async refresh(userId: string, refreshToken: string) {
    const isValid = await this.usersService.validateRefreshToken(
      userId,
      refreshToken,
    );
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.usersService.findOne(userId);
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );

    return tokens;
  }

  // ── Logout ─────────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  // ── Token generation ───────────────────────────────────────────────
  private async generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      orgId: user.organization?._id?.toString() || user.organization?.toString() || null,
      permissions: user.permissions || [],
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

  private sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.refreshToken;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    return obj;
  }
}
