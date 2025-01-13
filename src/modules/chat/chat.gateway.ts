import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { TokenService } from 'src/authentication/token.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { Prisma, Project, ProjectConversation } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SUPER_ADMIN, UserStatus } from 'src/config/constants';
import { ProjectPermissionSet } from '../project/project.permissions';
import * as BluebirdPromise from 'bluebird';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private clients: { clientId: string, userId: number, key: string }[] = [];
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() server: Server;

  constructor(private readonly tokenService: TokenService, private prisma: PrismaService) { }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const authorizationHeader = client.handshake.headers['authorization'];
      if (!authorizationHeader) {
        throw { message: "No Authenticattion Token Found, closing the connection" }
      }

      const user = await this.tokenService.verifyUserToken(authorizationHeader, true);
      if (!user) {
        throw { message: "Invalid Authkey, No User Found" }
      }
      const userAgent = client.handshake.headers['user-agent'];
      const ipAddress = this.getClientIpAddress(client.handshake.address);

      // Create a unique identifier by combining user agent and IP address
      const clientIdentifier = `${userAgent}-${ipAddress}-${user.userId}`;
      let connectingClient = this.clients.find((c) => c.key === clientIdentifier && c.clientId !== client.id);
      if (connectingClient) {
        this.logger.log(`Duplicate User: ${user.userId} disconnecting, Client: ${connectingClient.clientId}`);
        let socket = this.findSocketByClientId(client.id);
        if (socket) {
          socket.disconnect(true);
        }
      }
      this.logger.log(`User: ${user.userId} connected, Client: ${client.id}`);
      this.clients.push({ clientId: client.id, userId: user.userId, key: clientIdentifier });
    } catch (err) {
      this.logger.error("Error while establishing a connection to websocket user, ", err.message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    let disconnectingClient = this.clients.find((c) => c.clientId !== client.id);
    this.clients = this.clients.filter((c) => c.clientId !== client.id);
    this.logger.log(`Client ${client.id} Disconnected - User: ${disconnectingClient?.userId}`)
  }

  private getClientIpAddress(ipAddress: string | string[]): string {
    if (Array.isArray(ipAddress)) {
      return ipAddress[0];
    }
    return ipAddress;
  }

  @SubscribeMessage('chat')
  handleMessage(client: Socket, payload: ChatMessageDto): string {

    if (payload instanceof ChatMessageDto) {
      console.log('Received valid message:', payload);
    }
    console.log("Message received", client.id, payload);
    // this.sendMessage(client)
    return 'Hello world!';
  }


  async sendMessage(message: ProjectConversation & {Project: Partial<Project>}, senderId: number) {
    let allUsers = await this.prisma.user.findMany({
      where: {
        status: UserStatus.active,
        // id:{
        //   not: senderId
        // },
        AND: {
          OR: [
            {
              ProjectMembers: {
                some: {
                  projectId: message.projectId
                }
              }
            },
            {
              userRole: {
                some: {
                  OR: [
                    {
                      Role: {
                        RolePermissions: {
                          some: {
                            Permission: {
                              action: ProjectPermissionSet.REAL_ALL_PROJECT
                            }
                          }
                        }
                      }
                    },
                    {
                      Role: {
                        slug: SUPER_ADMIN
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    })
    this.logger.log(`Found ${allUsers.length} subscribers for the project`);
    if (allUsers && allUsers.length > 0) {
      // allUsers.forEach((ele) => {
        const MAX_CONCURRENT_OPERATIONS = 10;
        await BluebirdPromise.map(allUsers, async (ele) => {
          let unreadMessageCount = await this.prisma.projectConversation.count({
            where:{
              projectId: message.projectId,
              userId: {
                not: ele.id
              },
              AND:{
                OR:[
                  {
                    ReadLog:{
                      some:{
                        userId: ele.id,
                        read: false
                      }
                    }
                  },
                  {
                    ReadLog:{
                      none:{
                        userId: ele.id
                      }
                    }
                  }
                ]
              }
            }
          })
        const connectedClient : typeof this.clients = [];
        this.clients.forEach(clientData => {
          if(clientData.userId === ele.id){
            connectedClient.push(clientData)
          }
        });

        if (connectedClient.length === 0) return
        connectedClient.forEach((eachConnectedClient) => {
          const socket = this.findSocketByClientId(eachConnectedClient.clientId);
          if (socket) {
            try {
              socket.emit('chat', {
                ...message,
                unreadConversationCount: unreadMessageCount
              });
              this.logger.log(`Sent message to UserId: ${eachConnectedClient.userId}`);
            } catch (err) {
              this.logger.error("Some error while emitting message", err.message);
            }
          }
        })      
      // })
    }, { concurrency: MAX_CONCURRENT_OPERATIONS });
    }
  }

  findSocketByClientId(clientId: string): Socket | undefined {
    const sockets = this.server.sockets.sockets;
    for (const [id, socket] of sockets) {
      if (id === clientId) {
        return socket;
      }
    }
    return undefined;
  }
}
