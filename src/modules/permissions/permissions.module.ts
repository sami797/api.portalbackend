import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, AuthorizationService]
})
export class PermissionsModule {}
