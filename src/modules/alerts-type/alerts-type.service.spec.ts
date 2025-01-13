import { Test, TestingModule } from '@nestjs/testing';
import { AlertsTypeService } from './alerts-type.service';

describe('AlertsTypeService', () => {
  let service: AlertsTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsTypeService],
    }).compile();

    service = module.get<AlertsTypeService>(AlertsTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
