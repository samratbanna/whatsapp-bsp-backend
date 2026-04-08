import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(orgId: string): Promise<{
        messages: {
            total: number;
            today: number;
            thisWeek: number;
        };
        contacts: {
            total: number;
            newToday: number;
        };
        campaigns: {
            total: number;
            active: number;
        };
        flows: {
            active: number;
        };
        delivery: {
            sent: number;
            delivered: number;
            read: number;
            failed: number;
            deliveryRate: number;
            readRate: number;
            failureRate: number;
        };
        chart: {
            messagesByDay: {
                inbound: number;
                outbound: number;
                date: string;
            }[];
        };
    }>;
    getMessagesByDay(orgId: string, days?: number): Promise<{
        inbound: number;
        outbound: number;
        date: string;
    }[]>;
    getCampaignStats(orgId: string, campaignId?: string): Promise<any[]>;
    getContactGrowth(orgId: string, days?: number): Promise<any[]>;
    getFlowStats(orgId: string): Promise<any[]>;
    getTopContacts(orgId: string, limit?: number): Promise<any[]>;
    getPlatformStats(): Promise<{
        orgs: number;
        messages: number;
        contacts: number;
        campaigns: number;
        revenueByPlan: any[];
    }>;
}
