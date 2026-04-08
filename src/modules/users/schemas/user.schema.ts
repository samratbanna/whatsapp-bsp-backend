import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role, UserStatus } from '../../../common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ enum: Role, default: Role.ORG_ADMIN })
  role: Role;

  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  organization: Types.ObjectId | null; // null for super_admin

  @Prop({ trim: true })
  avatar?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ select: false })
  refreshToken?: string; // hashed

  @Prop({ type: Date })
  lastLoginAt?: Date;

  // For password reset flow
  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ type: Date, select: false })
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ organization: 1 });
