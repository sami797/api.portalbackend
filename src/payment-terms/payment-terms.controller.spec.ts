import { Test, TestingModule } from '@nestjs/testing';
import { PaymentTermsController } from './payment-terms.controller';

describe('PaymentTermsController', () => {
  let controller: PaymentTermsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentTermsController],
    }).compile();

    controller = module.get<PaymentTermsController>(PaymentTermsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
