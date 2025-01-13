import { Test, TestingModule } from '@nestjs/testing';
import { PayrollCycleService } from './payroll-cycle.service';

describe('PayrollCycleService', () => {
  let service: PayrollCycleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollCycleService],
    }).compile();

    service = module.get<PayrollCycleService>(PayrollCycleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
