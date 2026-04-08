import { Model } from 'mongoose';
import { MessageDocument } from '../messages/schemas/message.schema';
import { CampaignDocument } from '../campaigns/schemas/campaign.schema';
import { ContactDocument } from '../contacts/schemas/contact.schema';
import { FlowDocument } from '../flow-builder/schemas/flow.schema';
export declare class AnalyticsService {
    private messageModel;
    private campaignModel;
    private contactModel;
    private flowModel;
    constructor(messageModel: Model<MessageDocument>, campaignModel: Model<CampaignDocument>, contactModel: Model<ContactDocument>, flowModel: Model<FlowDocument>);
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
    getDeliveryStats(orgId: string): Promise<{
        sent: number;
        delivered: number;
        read: number;
        failed: number;
        deliveryRate: number;
        readRate: number;
        failureRate: number;
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
