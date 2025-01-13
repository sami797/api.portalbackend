import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserAuthorizationService } from './user.authorization.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    UserService, 
    UserAuthorizationService,
  ],
  exports: [UserService]
})
export class UserModule { }
