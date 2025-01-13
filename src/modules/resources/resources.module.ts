import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/authentication/token.service';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, AuthorizationService, JwtService, TokenService]
})
export class ResourcesModule {}
