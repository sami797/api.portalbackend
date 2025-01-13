import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectAuthorizationService } from './project.authorization.service';
import { MailService } from 'src/mail/mail.service';
import { ChatGateway } from '../chat/chat.gateway';
import { TokenService } from 'src/authentication/token.service';
import { JwtService } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { REDIS_DB_NAME } from 'src/config/constants';

@Module({
  imports:[
    BullModule.registerQueue({
      name: 'xero',
      configKey: REDIS_DB_NAME,
    }),
  ],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAuthorizationService, MailService, ChatGateway, TokenService, JwtService]
})
export class ProjectModule {}
