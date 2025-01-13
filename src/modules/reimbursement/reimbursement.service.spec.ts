import { Test, TestingModule } from '@nestjs/testing';
import { ReimbursementService } from './reimbursement.service';

describe('ReimbursementService', () => {
  let service: ReimbursementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReimbursementService],
    }).compile();

    service = module.get<ReimbursementService>(ReimbursementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
