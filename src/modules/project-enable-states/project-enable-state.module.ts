import { Module } from '@nestjs/common';
import { ProjectEnableStateService } from './project-enable-state.service';
import { ProjectEnableStateController } from './project-enable-state.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEnableState } from './entities/project-enable-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEnableState])],
  controllers: [ProjectEnableStateController],
  providers: [ProjectEnableStateService]
})

export class ProjectEnableStateModule {}
