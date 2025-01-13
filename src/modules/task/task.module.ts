import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, AuthorizationService]
})
export class TaskModule {}
