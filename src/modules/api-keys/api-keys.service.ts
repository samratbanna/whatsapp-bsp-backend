import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes, createHash } from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';
import { CreateApiKeyDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) { }

  private generateKey(): string {
    return `bsp_live_${randomBytes(24).toString('hex')}`;
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async generateForOrg(
    orgId: string,
    adminId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKeyDocument; fullKey: string }> {
    // Delete any existing key so generate is idempotent (works like reset)
    await this.apiKeyModel.deleteOne({ organization: new Types.ObjectId(orgId) });

    const fullKey = this.generateKey();
    console.log("fullKey", fullKey);

    const keyHash = this.hashKey(fullKey);

    const doc = await this.apiKeyModel.create({
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(adminId),
      name: dto.name,
      keyHash,
      keyPrefix: fullKey.substring(0, 16),
      scopes: dto.scopes || [],
      allowedIps: dto.allowedIps || [],
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    const docObject = doc.toObject();
    delete (docObject as any).keyHash;

    return { apiKey: docObject as any, fullKey };
  }

  async resetForOrg(
    orgId: string,
    adminId: string,
  ): Promise<{ apiKey: ApiKeyDocument; fullKey: string }> {
    // Delete existing
    await this.apiKeyModel.deleteOne({ organization: new Types.ObjectId(orgId) });

    const fullKey = this.generateKey();
    const keyHash = this.hashKey(fullKey);

    const doc = await this.apiKeyModel.create({
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(adminId),
      name: 'Production Key',
      keyHash,
      keyPrefix: fullKey.substring(0, 16),
      scopes: [],
      allowedIps: [],
    });

    const docObject = doc.toObject();
    delete (docObject as any).keyHash;

    return { apiKey: docObject as any, fullKey };
  }

  async revokeForOrg(orgId: string): Promise<ApiKeyDocument> {
    const key = await this.apiKeyModel.findOneAndUpdate(
      { organization: new Types.ObjectId(orgId) },
      { isActive: false },
      { new: true },
    ).select('-keyHash');

    if (!key) throw new NotFoundException('API key not found for organization');
    return key;
  }

  async getForOrg(orgId: string): Promise<ApiKeyDocument | null> {
    return this.apiKeyModel
      .findOne({ organization: new Types.ObjectId(orgId) })
      .select('-keyHash')
      .exec();
  }

  async validateKey(
    rawKey: string,
  ): Promise<{ valid: boolean; orgId?: string; scopes?: string[]; allowedIps?: string[] }> {
    const keyHash = this.hashKey(rawKey);
    const doc = await this.apiKeyModel
      .findOne({ keyHash, isActive: true })
      .exec();

    if (!doc) return { valid: false };
    if (doc.expiresAt && doc.expiresAt < new Date()) return { valid: false };

    // Update last used (fire and forget)
    this.apiKeyModel.updateOne({ _id: doc._id }, { lastUsedAt: new Date() }).exec();

    return {
      valid: true,
      orgId: doc.organization.toString(),
      scopes: doc.scopes,
      allowedIps: doc.allowedIps,
    };
  }

  async getAllKeys(): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel
      .find()
      .select('-keyHash')
      .populate('organization', 'name slug status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
