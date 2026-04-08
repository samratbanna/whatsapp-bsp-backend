import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppConfigDocument = AppConfig & Document;

@Schema({ timestamps: true })
export class AppConfig {
  @Prop({ required: true, unique: true, default: 'global' })
  key: string; // always 'global' — singleton pattern

  // Branding
  @Prop({ default: 'WhatsApp BSP' })
  appName: string;

  @Prop()
  appLogo?: string;

  @Prop()
  appFavicon?: string;

  @Prop({ default: '#25D366' })
  primaryColor: string;

  // Landing page
  @Prop({ default: true })
  landingPageEnabled: boolean;

  @Prop()
  heroTitle?: string;

  @Prop()
  heroSubtitle?: string;

  // Registration
  @Prop({ default: true })
  registrationEnabled: boolean;

  @Prop({ default: true })
  emailVerificationRequired: boolean;

  // SMTP (for emails)
  @Prop({ default: false })
  smtpEnabled: boolean;

  @Prop()
  smtpHost?: string;

  @Prop()
  smtpPort?: number;

  @Prop()
  smtpUser?: string;

  @Prop({ select: false })
  smtpPassword?: string;

  @Prop()
  smtpFromEmail?: string;

  @Prop()
  smtpFromName?: string;

  // Meta / WhatsApp
  @Prop()
  metaAppId?: string;

  @Prop({ select: false })
  metaAppSecret?: string;

  @Prop()
  metaWebhookVerifyToken?: string;

  // Social links
  @Prop()
  facebookUrl?: string;

  @Prop()
  twitterUrl?: string;

  @Prop()
  linkedinUrl?: string;

  // Footer
  @Prop()
  footerText?: string;

  @Prop()
  supportEmail?: string;

  @Prop()
  supportPhone?: string;

  // Maintenance
  @Prop({ default: false })
  maintenanceMode: boolean;

  @Prop()
  maintenanceMessage?: string;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
