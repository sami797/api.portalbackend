import { Test, TestingModule } from '@nestjs/testing';
import { CashAdvanceController } from './cash-advance.controller';
import { CashAdvanceService } from './cash-advance.service';

describe('CashAdvanceController', () => {
  let controller: CashAdvanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashAdvanceController],
      providers: [CashAdvanceService],
    }).compile();

    controller = module.get<CashAdvanceController>(CashAdvanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
