import { Test, TestingModule } from '@nestjs/testing';
import { ProjectComponentsService } from './project-components.service';

describe('ProjectComponentsService', () => {
  let service: ProjectComponentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectComponentsService],
    }).compile();

    service = module.get<ProjectComponentsService>(ProjectComponentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
