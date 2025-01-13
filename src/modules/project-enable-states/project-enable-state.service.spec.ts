import { Test, TestingModule } from '@nestjs/testing';
import { ProjectEnableStateService } from './project-enable-state.service';

describe('ProjectEnableStateService', () => {
  let service: ProjectEnableStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectEnableStateService],
    }).compile();

    service = module.get<ProjectEnableStateService>(ProjectEnableStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
