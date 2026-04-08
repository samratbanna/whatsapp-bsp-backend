import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppConfig, AppConfigDocument } from './schemas/app-config.schema';

@Injectable()
export class AppConfigService implements OnModuleInit {
  constructor(
    @InjectModel(AppConfig.name)
    private configModel: Model<AppConfigDocument>,
  ) {}

  // Seed default config on startup
  async onModuleInit() {
    const existing = await this.configModel.findOne({ key: 'global' });
    if (!existing) {
      await this.configModel.create({ key: 'global' });
      console.log('✅ App config initialized');
    }
  }

  async get(includeSecrets = false): Promise<AppConfigDocument> {
    const query = this.configModel.findOne({ key: 'global' });
    if (includeSecrets) query.select('+smtpPassword +metaAppSecret');
    const result = await query.exec();
    return result!;
  }

  async update(data: Partial<AppConfig>): Promise<AppConfigDocument> {
    return this.configModel.findOneAndUpdate(
      { key: 'global' },
      { $set: data },
      { new: true, upsert: true },
    );
  }

  // Public config — safe fields only for frontend
  async getPublic() {
    const config = await this.get();
    return {
      appName: config.appName,
      appLogo: config.appLogo,
      appFavicon: config.appFavicon,
      primaryColor: config.primaryColor,
      landingPageEnabled: config.landingPageEnabled,
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      registrationEnabled: config.registrationEnabled,
      facebookUrl: config.facebookUrl,
      twitterUrl: config.twitterUrl,
      linkedinUrl: config.linkedinUrl,
      footerText: config.footerText,
      supportEmail: config.supportEmail,
      supportPhone: config.supportPhone,
      maintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage,
    };
  }
}
