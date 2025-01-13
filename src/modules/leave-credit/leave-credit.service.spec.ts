import { Test, TestingModule } from '@nestjs/testing';
import { LeaveCreditService } from './leave-credit.service';

describe('LeaveCreditService', () => {
  let service: LeaveCreditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaveCreditService],
    }).compile();

    service = module.get<LeaveCreditService>(LeaveCreditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
