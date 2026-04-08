import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';
import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── DTOs ──────────────────────────────────────────────────────────────
export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Key' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['messages:send', 'contacts:read'],
  })
  @IsArray()
  @IsOptional()
  scopes?: string[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

// ── Service ───────────────────────────────────────────────────────────
@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  private generateKey(): string {
    return `bsp_live_${randomBytes(24).toString('hex')}`;
  }

  async create(orgId: string, userId: string, dto: CreateApiKeyDto) {
    const key = this.generateKey();
    const doc = await this.apiKeyModel.create({
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(userId),
      name: dto.name,
      key,
      keyPrefix: key.substring(0, 16),
      scopes: dto.scopes || ['messages:send', 'contacts:read', 'templates:read'],
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    // Return full key ONCE — never shown again
    return { ...doc.toObject(), key };
  }

  async findAll(orgId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel
      .find({ organization: new Types.ObjectId(orgId) })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async revoke(id: string, orgId: string): Promise<ApiKeyDocument> {
    const key = await this.apiKeyModel.findOneAndUpdate(
      { _id: id, organization: new Types.ObjectId(orgId) },
      { isActive: false },
      { new: true },
    );
    if (!key) throw new NotFoundException('API key not found');
    return key;
  }

  async remove(id: string, orgId: string): Promise<void> {
    const result = await this.apiKeyModel.deleteOne({
      _id: id,
      organization: new Types.ObjectId(orgId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('API key not found');
  }

  async validateKey(rawKey: string): Promise<ApiKeyDocument | null> {
    const doc = await this.apiKeyModel
      .findOne({ key: rawKey, isActive: true })
      .select('+key')
      .populate('organization')
      .exec();

    if (!doc) return null;
    if (doc.expiresAt && doc.expiresAt < new Date()) return null;

    // Update last used
    await this.apiKeyModel.findByIdAndUpdate(doc._id, { lastUsedAt: new Date() });
    return doc;
  }
}
