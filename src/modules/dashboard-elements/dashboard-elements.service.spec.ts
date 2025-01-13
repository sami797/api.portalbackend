import { Test, TestingModule } from '@nestjs/testing';
import { DashboardElementsService } from './dashboard-elements.service';

describe('DashboardElementsService', () => {
  let service: DashboardElementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardElementsService],
    }).compile();

    service = module.get<DashboardElementsService>(DashboardElementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
