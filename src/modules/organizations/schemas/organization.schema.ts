import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrgStatus } from '../../../common/enums';

export type OrganizationDocument = Organization & Document;

@Schema({ _id: false })
export class InvoiceBusinessDetails {
  @Prop({ trim: true })
  legalBusinessName?: string;

  @Prop({ trim: true })
  tradeName?: string;

  @Prop({ trim: true, uppercase: true })
  gstin?: string;

  @Prop({ trim: true, uppercase: true })
  pan?: string;

  @Prop({ trim: true, uppercase: true })
  cin?: string;

  @Prop({ trim: true, uppercase: true })
  udyamNumber?: string;

  @Prop({ trim: true })
  addressLine1?: string;

  @Prop({ trim: true })
  addressLine2?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  pinCode?: string;

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true, lowercase: true })
  contactEmail?: string;

  @Prop({ trim: true })
  contactPhone?: string;

  @Prop({ trim: true })
  bankAccountName?: string;

  @Prop({ trim: true })
  bankAccountNumber?: string;

  @Prop({ trim: true })
  bankName?: string;

  @Prop({ trim: true, uppercase: true })
  ifscCode?: string;

  @Prop({ trim: true })
  bankBranch?: string;
}

const InvoiceBusinessDetailsSchema = SchemaFactory.createForClass(
  InvoiceBusinessDetails,
);

@Schema({ _id: false })
export class LoginUserDetails {
  @Prop({ trim: true })
  userId?: string;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  designation?: string;
}

const LoginUserDetailsSchema = SchemaFactory.createForClass(LoginUserDetails);

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // subdomain-friendly unique id

  @Prop({ trim: true })
  logo?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ enum: OrgStatus, default: OrgStatus.TRIAL })
  status: OrgStatus;

  @Prop({ type: Date })
  trialEndsAt?: Date;

  // Usage counters (reset monthly via cron)
  @Prop({ default: 0 })
  messagesUsedThisMonth: number;

  @Prop({ type: Date, default: () => new Date() })
  usageResetAt: Date;

  // WhatsApp Business Account(s) linked — populated later
  @Prop({ type: [Types.ObjectId], ref: 'Waba', default: [] })
  wabaIds: Types.ObjectId[];

  // Billing contact
  @Prop({ trim: true })
  billingEmail?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ trim: true })
  timezone: string;

  @Prop({ type: InvoiceBusinessDetailsSchema })
  businessDetails?: InvoiceBusinessDetails;

  @Prop({ type: LoginUserDetailsSchema })
  loginUserDetails?: LoginUserDetails;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ slug: 1 }, { unique: true });
