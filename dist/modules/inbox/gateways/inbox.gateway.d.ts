import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../../messages/messages.service';
export declare class InboxGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private configService;
    private messagesService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(jwtService: JwtService, configService: ConfigService, messagesService: MessagesService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinConversation(client: Socket, data: {
        phone: string;
    }): void;
    handleLeaveConversation(client: Socket, data: {
        phone: string;
    }): void;
    handleSendMessage(client: Socket, data: {
        to: string;
        text: string;
        wabaId?: string;
    }): Promise<{
        success: boolean;
        messageId: import("mongoose").Types.ObjectId;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
        messageId?: undefined;
    }>;
    handleMarkRead(client: Socket, data: {
        phone: string;
    }): Promise<void>;
    broadcastInbound(orgId: string, message: any): void;
    broadcastStatusUpdate(orgId: string, update: any): void;
    getOnlineAgentCount(orgId: string): number;
}
