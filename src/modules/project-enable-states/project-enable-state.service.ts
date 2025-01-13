import { Controller, Get, Param } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEnableState } from '../project-enable-states/entities/project-enable-state.entity'; // Adjust the import path if necessary
import { CreateProjectEnableStateDto } from './dto/create-project-enable-state.dto'; // Correct import path
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProjectEnableStateService {
    constructor(
        @InjectRepository(ProjectEnableState)
        private readonly projectEnableStateRepository: Repository<ProjectEnableState>,
           private readonly prisma: PrismaService
     ) {}

    // constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateProjectEnableStateDto): Promise<ProjectEnableState> {
        // Example: using TypeORM to save to database
        const projectEnableState = new ProjectEnableState();
        projectEnableState.pId = dto.pId;
        projectEnableState.pstateId = dto.pstateId;
        projectEnableState.isPublished = dto.isPublished;
        projectEnableState.isDeleted = dto.isDeleted;
        // Assuming ProjectEnableState has relationships defined in its entity
        // Adjust this part according to your actual entity structure
        projectEnableState.projectId = dto.projectId;
        // Save to database
        return await this.projectEnableStateRepository.save(projectEnableState);
    }

   

    async findByProjectId(projectId: string) {
      return this.prisma.projectEnableStates.findMany({
        where: { pId: Number(projectId) },
      });
    }
}
