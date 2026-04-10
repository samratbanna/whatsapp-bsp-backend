import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import {
  ALL_FEATURE_PERMISSIONS,
  FeaturePermission,
  Role,
  UserStatus,
} from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    if (dto.role === Role.SUPER_ADMIN && dto.organizationId) {
      throw new BadRequestException('Super admin cannot belong to an organization');
    }

    const normalizedRole = dto.role || Role.ORG_ADMIN;
    const permissions = this.getResolvedPermissions(normalizedRole, dto.permissions);

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = new this.userModel({
      ...dto,
      role: normalizedRole,
      permissions,
      password: hashed,
      organization: dto.organizationId
        ? new Types.ObjectId(dto.organizationId)
        : null,
    });

    return user.save();
  }

  async findAll(orgId?: string, status?: UserStatus): Promise<UserDocument[]> {
    const filter: any = {};
    if (orgId) filter.organization = new Types.ObjectId(orgId);
    if (status) filter.status = status;

    return this.userModel
      .find(filter)
      .populate('organization', 'name slug status')
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .populate('organization', 'name slug status plan')
      .select('-password -refreshToken')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel
      .findOne({ email: email.toLowerCase() })
      .populate('organization');

    if (includePassword) query.select('+password +refreshToken');
    return query.exec();
  }

  async createByOrgAdmin(
    orgId: string,
    dto: CreateUserDto,
  ): Promise<UserDocument> {
    if (!orgId) {
      throw new BadRequestException('Organization ID is required for org admin');
    }

    const role = dto.role || Role.AGENT;
    if (role !== Role.AGENT) {
      throw new ForbiddenException('Org admin can only create organization users with agent role');
    }

    return this.create({
      ...dto,
      role,
      organizationId: orgId,
    });
  }

  async bulkCreateByOrgAdmin(
    orgId: string,
    users: CreateUserDto[],
  ): Promise<UserDocument[]> {
    if (!users.length) return [];
    return Promise.all(users.map((user) => this.createByOrgAdmin(orgId, user)));
  }

  async findAllByOrganization(
    orgId: string,
    status?: UserStatus,
  ): Promise<UserDocument[]> {
    if (!orgId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.findAll(orgId, status);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    // If password is being updated, hash it
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }

    if (dto.role) {
      dto.permissions = this.getResolvedPermissions(dto.role, dto.permissions);
    } else if (dto.permissions && dto.permissions.length) {
      dto.permissions = [...new Set(dto.permissions)];
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('organization', 'name slug')
      .select('-password -refreshToken')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateByOrgAdmin(
    orgId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserDocument> {
    const existing = await this.userModel.findById(id).exec();
    if (!existing) throw new NotFoundException('User not found');

    if (!existing.organization || existing.organization.toString() !== orgId) {
      throw new ForbiddenException('You can only manage users in your own organization');
    }

    if (existing.role === Role.ORG_ADMIN || dto.role === Role.ORG_ADMIN || dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Org admin can only manage agent users');
    }

    dto.organizationId = orgId;
    dto.role = Role.AGENT;

    return this.update(id, dto);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userModel.findById(id).select('+password').exec();
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await user.save();
  }

  async suspend(id: string): Promise<UserDocument> {
    return this.update(id, { status: UserStatus.SUSPENDED });
  }

  async activate(id: string): Promise<UserDocument> {
    return this.update(id, { status: UserStatus.ACTIVE });
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    const hashed = token ? await bcrypt.hash(token, 10) : null;
    await this.userModel.findByIdAndUpdate(id, { refreshToken: hashed });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  async validateRefreshToken(id: string, token: string): Promise<boolean> {
    const user = await this.userModel.findById(id).select('+refreshToken').exec();
    if (!user?.refreshToken) return false;
    return bcrypt.compare(token, user.refreshToken);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await user.deleteOne();
  }

  async seedSuperAdmin(email: string, password: string): Promise<void> {
    const exists = await this.userModel.findOne({ role: Role.SUPER_ADMIN });
    if (exists) return;

    const hashed = await bcrypt.hash(password, 12);
    await this.userModel.create({
      name: 'Super Admin',
      email,
      password: hashed,
      role: Role.SUPER_ADMIN,
      permissions: ALL_FEATURE_PERMISSIONS,
      status: UserStatus.ACTIVE,
      organization: null,
    });

    console.log(`✅ Super admin seeded: ${email}`);
  }

  private getResolvedPermissions(
    role: Role,
    permissions?: FeaturePermission[],
  ): FeaturePermission[] {
    if (role === Role.SUPER_ADMIN || role === Role.ORG_ADMIN) {
      return [...ALL_FEATURE_PERMISSIONS];
    }
    return permissions ? [...new Set(permissions)] : [];
  }
}
