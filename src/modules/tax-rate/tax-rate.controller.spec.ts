import { Test, TestingModule } from '@nestjs/testing';
import { TaxRateController } from './tax-rate.controller';
import { TaxRateService } from './tax-rate.service';

describe('TaxRateController', () => {
  let controller: TaxRateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxRateController],
      providers: [TaxRateService],
    }).compile();

    controller = module.get<TaxRateController>(TaxRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
