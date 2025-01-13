import { Test, TestingModule } from '@nestjs/testing';
import { XeroAccountingController } from './xero-accounting.controller';

describe('XeroAccountingController', () => {
  let controller: XeroAccountingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XeroAccountingController],
    }).compile();

    controller = module.get<XeroAccountingController>(XeroAccountingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
