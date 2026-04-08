"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var InboxGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const messages_service_1 = require("../../messages/messages.service");
let InboxGateway = InboxGateway_1 = class InboxGateway {
    jwtService;
    configService;
    messagesService;
    server;
    logger = new common_1.Logger(InboxGateway_1.name);
    connectedClients = new Map();
    constructor(jwtService, configService, messagesService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.messagesService = messagesService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token)
                throw new Error('No token');
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            this.connectedClients.set(client.id, {
                userId: payload.sub,
                orgId: payload.orgId,
                role: payload.role,
            });
            client.join(`org:${payload.orgId}`);
            this.logger.log(`Client connected: ${client.id} | org: ${payload.orgId}`);
            client.emit('connected', { message: 'Connected to inbox', clientId: client.id });
        }
        catch (err) {
            this.logger.warn(`Unauthorized connection: ${client.id}`);
            client.emit('error', { message: 'Unauthorized' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinConversation(client, data) {
        const meta = this.connectedClients.get(client.id);
        if (!meta)
            return;
        const room = `conv:${meta.orgId}:${data.phone}`;
        client.join(room);
        client.emit('joined:conversation', { room, phone: data.phone });
    }
    handleLeaveConversation(client, data) {
        const meta = this.connectedClients.get(client.id);
        if (!meta)
            return;
        client.leave(`conv:${meta.orgId}:${data.phone}`);
    }
    async handleSendMessage(client, data) {
        const meta = this.connectedClients.get(client.id);
        if (!meta)
            return { error: 'Unauthorized' };
        try {
            const dto = { to: data.to, text: data.text, wabaId: data.wabaId };
            const message = await this.messagesService.sendText(meta.orgId, dto);
            this.server
                .to(`conv:${meta.orgId}:${data.to}`)
                .emit('new:message', message);
            return { success: true, messageId: message._id };
        }
        catch (err) {
            return { error: err.message };
        }
    }
    async handleMarkRead(client, data) {
        const meta = this.connectedClients.get(client.id);
        if (!meta)
            return;
        this.server
            .to(`conv:${meta.orgId}:${data.phone}`)
            .emit('conversation:read', { phone: data.phone, by: meta.userId });
    }
    broadcastInbound(orgId, message) {
        const phone = message.from;
        this.server.to(`org:${orgId}`).emit('new:message', message);
        this.server.to(`conv:${orgId}:${phone}`).emit('new:message', message);
    }
    broadcastStatusUpdate(orgId, update) {
        this.server.to(`org:${orgId}`).emit('message:status', update);
    }
    getOnlineAgentCount(orgId) {
        return Array.from(this.connectedClients.values()).filter((c) => c.orgId === orgId).length;
    }
};
exports.InboxGateway = InboxGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], InboxGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], InboxGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], InboxGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send:message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], InboxGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark:read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], InboxGateway.prototype, "handleMarkRead", null);
exports.InboxGateway = InboxGateway = InboxGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: 'inbox',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        messages_service_1.MessagesService])
], InboxGateway);
//# sourceMappingURL=inbox.gateway.js.map