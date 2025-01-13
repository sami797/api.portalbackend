import { Test, TestingModule } from '@nestjs/testing';
import { LeaveCreditController } from './leave-credit.controller';
import { LeaveCreditService } from './leave-credit.service';

describe('LeaveCreditController', () => {
  let controller: LeaveCreditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveCreditController],
      providers: [LeaveCreditService],
    }).compile();

    controller = module.get<LeaveCreditController>(LeaveCreditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
