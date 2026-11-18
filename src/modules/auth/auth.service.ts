import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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
  OrgStatus,
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

  // ── Register (website self sign-up): creates org + org_admin user ──
  async register(dto: RegisterDto) {
    // Check first so a taken email never leaves an empty organization behind.
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email already registered');
    }

    const org = await this.orgsService.create({
      name: dto.organizationName,
      phone: dto.phone,
      billingEmail: dto.email,
    }, { createAdminUser: false, source: 'self_signup' });

    let user;
    try {
      user = await this.usersService.create({
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: Role.ORG_ADMIN,
        permissions: ALL_FEATURE_PERMISSIONS,
        organizationId: (org._id as any).toString(),
        phone: dto.phone,
      });
    } catch (error) {
      // e.g. the same email registering twice at once — undo the organization.
      await this.orgsService.remove((org._id as any).toString()).catch(() => undefined);
      throw error;
    }

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

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended. Contact support.');
    }
    this.assertOrgNotSuspended(user);

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
    this.assertOrgNotSuspended(user);

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

  // A suspended organization (by the super admin, or by its reseller) locks out its users. The
  // access token already issued lives on until it expires (JWT_EXPIRES_IN), then refresh fails.
  private assertOrgNotSuspended(user: any) {
    const org = user.organization;
    if (org && typeof org === 'object' && org.status === OrgStatus.SUSPENDED) {
      throw new UnauthorizedException('Organization suspended. Contact your provider.');
    }
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
