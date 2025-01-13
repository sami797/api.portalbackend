import { Test, TestingModule } from '@nestjs/testing';
import { PayrollCycleController } from './payroll-cycle.controller';
import { PayrollCycleService } from './payroll-cycle.service';

describe('PayrollCycleController', () => {
  let controller: PayrollCycleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollCycleController],
      providers: [PayrollCycleService],
    }).compile();

    controller = module.get<PayrollCycleController>(PayrollCycleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
