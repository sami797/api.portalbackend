import { Test, TestingModule } from '@nestjs/testing';
import { CashAdvanceService } from './cash-advance.service';

describe('CashAdvanceService', () => {
  let service: CashAdvanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashAdvanceService],
    }).compile();

    service = module.get<CashAdvanceService>(CashAdvanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
