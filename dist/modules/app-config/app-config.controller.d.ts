import { AppConfigService } from './app-config.service';
import { AppConfig } from './schemas/app-config.schema';
export declare class AppConfigController {
    private readonly appConfigService;
    constructor(appConfigService: AppConfigService);
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
    get(): Promise<import("./schemas/app-config.schema").AppConfigDocument>;
    update(data: Partial<AppConfig>): Promise<import("./schemas/app-config.schema").AppConfigDocument>;
}
