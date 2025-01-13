import { Test, TestingModule } from '@nestjs/testing';
import { SystemModulesController } from './system-modules.controller';
import { SystemModulesService } from './system-modules.service';

describe('SystemModulesController', () => {
  let controller: SystemModulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemModulesController],
      providers: [SystemModulesService],
    }).compile();

    controller = module.get<SystemModulesController>(SystemModulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
