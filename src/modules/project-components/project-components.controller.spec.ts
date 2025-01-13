import { Test, TestingModule } from '@nestjs/testing';
import { ProjectComponentsController } from './project-components.controller';
import { ProjectComponentsService } from './project-components.service';

describe('ProjectComponentsController', () => {
  let controller: ProjectComponentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectComponentsController],
      providers: [ProjectComponentsService],
    }).compile();

    controller = module.get<ProjectComponentsController>(ProjectComponentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
