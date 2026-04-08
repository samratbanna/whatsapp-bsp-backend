import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { AppConfig, AppConfigDocument } from './schemas/app-config.schema';
export declare class AppConfigService implements OnModuleInit {
    private configModel;
    constructor(configModel: Model<AppConfigDocument>);
    onModuleInit(): Promise<void>;
    get(includeSecrets?: boolean): Promise<AppConfigDocument>;
    update(data: Partial<AppConfig>): Promise<AppConfigDocument>;
    getPublic(): Promise<{
        appName: string;
        appLogo: string | undefined;
        appFavicon: string | undefined;
        primaryColor: string;
        landingPageEnabled: boolean;
        heroTitle: string | undefined;
        heroSubtitle: string | undefined;
        registrationEnabled: boolean;
        facebookUrl: string | undefined;
        twitterUrl: string | undefined;
        linkedinUrl: string | undefined;
        footerText: string | undefined;
        supportEmail: string | undefined;
        supportPhone: string | undefined;
        maintenanceMode: boolean;
        maintenanceMessage: string | undefined;
    }>;
}
