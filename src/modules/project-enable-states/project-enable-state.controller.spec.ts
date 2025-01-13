import { Test, TestingModule } from '@nestjs/testing';
import { ProjectEnableStateController } from './project-enable-state.controller';
import { ProjectEnableStateService } from './project-enable-state.service';

describe('ProjectEnableStateController', () => {
  let controller: ProjectEnableStateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectEnableStateController],
      providers: [ProjectEnableStateService],
    }).compile();

    controller = module.get<ProjectEnableStateController>(ProjectEnableStateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
