import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';

@Module({
  controllers: [RoleController],
  providers: [RoleService, AuthorizationService]
})
export class RoleModule {}
