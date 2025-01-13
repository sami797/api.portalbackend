import { Test, TestingModule } from '@nestjs/testing';
import { DashboardElementsController } from './dashboard-elements.controller';
import { DashboardElementsService } from './dashboard-elements.service';

describe('DashboardElementsController', () => {
  let controller: DashboardElementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardElementsController],
      providers: [DashboardElementsService],
    }).compile();

    controller = module.get<DashboardElementsController>(DashboardElementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
