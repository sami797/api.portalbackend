import { Module } from '@nestjs/common';
import { ProjectComponentsService } from './project-components.service';
import { ProjectComponentsController } from './project-components.controller';

@Module({
  controllers: [ProjectComponentsController],
  providers: [ProjectComponentsService]
})
export class ProjectComponentsModule {}
