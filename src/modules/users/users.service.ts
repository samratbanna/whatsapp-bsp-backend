import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { Role, UserStatus } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = new this.userModel({
      ...dto,
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

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    // If password is being updated, hash it
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('organization', 'name slug')
      .select('-password -refreshToken')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
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
      status: UserStatus.ACTIVE,
      organization: null,
    });

    console.log(`✅ Super admin seeded: ${email}`);
  }
}
