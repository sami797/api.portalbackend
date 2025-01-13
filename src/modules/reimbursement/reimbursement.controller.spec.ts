import { Test, TestingModule } from '@nestjs/testing';
import { ReimbursementController } from './reimbursement.controller';
import { ReimbursementService } from './reimbursement.service';

describe('ReimbursementController', () => {
  let controller: ReimbursementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReimbursementController],
      providers: [ReimbursementService],
    }).compile();

    controller = module.get<ReimbursementController>(ReimbursementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
