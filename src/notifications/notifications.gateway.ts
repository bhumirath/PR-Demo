import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    client.join(`user:${userId}`);
  }

  emitPrSubmitted(prId: number, prNumber: string) {
    this.server.emit('pr:submitted', { prId, prNumber, message: `PR ${prNumber} has been submitted` });
  }

  emitPrApproved(prId: number, prNumber: string) {
    this.server.emit('pr:approved', { prId, prNumber, message: `PR ${prNumber} has been approved` });
  }

  emitPrRejected(prId: number, prNumber: string) {
    this.server.emit('pr:rejected', { prId, prNumber, message: `PR ${prNumber} has been rejected` });
  }
}
