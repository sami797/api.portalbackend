import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { CreateProjectEnableStateDto } from './dto/create-project-enable-state.dto';
import { ProjectEnableStateService } from './project-enable-state.service';
import { ProjectEnableState } from './entities/project-enable-state.entity';
import { PrismaService } from '../../prisma.service';

@Controller('project-enable-states')
export class ProjectEnableStateController {
    constructor(private readonly projectEnableStateService: ProjectEnableStateService) {}

    @Post('updateProjectStates')
    async create(@Body() dto: CreateProjectEnableStateDto) {
        return await this.projectEnableStateService.create(dto);
    }

    @Get('by-project/:projectId')
    async getByProject(@Param('projectId') projectId: string) {
      return this.projectEnableStateService.findByProjectId(projectId);
    }

}