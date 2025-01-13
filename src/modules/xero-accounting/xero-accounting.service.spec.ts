import { Test, TestingModule } from '@nestjs/testing';
import { XeroAccountingService } from './xero-accounting.service';

describe('XeroAccountingService', () => {
  let service: XeroAccountingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XeroAccountingService],
    }).compile();

    service = module.get<XeroAccountingService>(XeroAccountingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
