import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/authentication/token.service';

@Module({
  providers: [ChatGateway, JwtService, TokenService, ]
})
export class ChatModule {}
