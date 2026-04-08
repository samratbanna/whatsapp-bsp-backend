import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../../messages/messages.service';
import { SendTextDto } from '../../messages/dto/message.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'inbox',
})
export class InboxGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InboxGateway.name);

  // Map: socketId → { userId, orgId, role }
  private connectedClients = new Map<string, any>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private messagesService: MessagesService,
  ) {}

  // ── Connection lifecycle ───────────────────────────────────────────
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      this.connectedClients.set(client.id, {
        userId: payload.sub,
        orgId: payload.orgId,
        role: payload.role,
      });

      // Join org room so we can broadcast to all agents of this org
      client.join(`org:${payload.orgId}`);

      this.logger.log(`Client connected: ${client.id} | org: ${payload.orgId}`);

      client.emit('connected', { message: 'Connected to inbox', clientId: client.id });
    } catch (err) {
      this.logger.warn(`Unauthorized connection: ${client.id}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Events: client → server ────────────────────────────────────────

  // Agent joins a specific conversation room
  @SubscribeMessage('join:conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { phone: string },
  ) {
    const meta = this.connectedClients.get(client.id);
    if (!meta) return;

    const room = `conv:${meta.orgId}:${data.phone}`;
    client.join(room);
    client.emit('joined:conversation', { room, phone: data.phone });
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { phone: string },
  ) {
    const meta = this.connectedClients.get(client.id);
    if (!meta) return;
    client.leave(`conv:${meta.orgId}:${data.phone}`);
  }

  // Agent sends a message from inbox
  @SubscribeMessage('send:message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; text: string; wabaId?: string },
  ) {
    const meta = this.connectedClients.get(client.id);
    if (!meta) return { error: 'Unauthorized' };

    try {
      const dto: SendTextDto = { to: data.to, text: data.text, wabaId: data.wabaId };
      const message = await this.messagesService.sendText(meta.orgId, dto);

      // Broadcast to all agents in this org watching this conversation
      this.server
        .to(`conv:${meta.orgId}:${data.to}`)
        .emit('new:message', message);

      return { success: true, messageId: message._id };
    } catch (err) {
      return { error: err.message };
    }
  }

  // Agent marks messages as read
  @SubscribeMessage('mark:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { phone: string },
  ) {
    const meta = this.connectedClients.get(client.id);
    if (!meta) return;
    // Notify other agents this conversation was read
    this.server
      .to(`conv:${meta.orgId}:${data.phone}`)
      .emit('conversation:read', { phone: data.phone, by: meta.userId });
  }

  // ── Server → client broadcast methods (called from webhook) ───────

  // Called when a new inbound message arrives via webhook
  broadcastInbound(orgId: string, message: any) {
    const phone = message.from;
    // Notify all agents of this org
    this.server.to(`org:${orgId}`).emit('new:message', message);
    // Notify agents watching this conversation
    this.server.to(`conv:${orgId}:${phone}`).emit('new:message', message);
  }

  // Called when message status updates (delivered/read)
  broadcastStatusUpdate(orgId: string, update: any) {
    this.server.to(`org:${orgId}`).emit('message:status', update);
  }

  // Get online agent count for an org
  getOnlineAgentCount(orgId: string): number {
    return Array.from(this.connectedClients.values()).filter(
      (c) => c.orgId === orgId,
    ).length;
  }
}
