import { Test, TestingModule } from '@nestjs/testing';
import { LeaveTypeController } from './leave-type.controller';
import { LeaveTypeService } from './leave-type.service';

describe('LeaveTypeController', () => {
  let controller: LeaveTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveTypeController],
      providers: [LeaveTypeService],
    }).compile();

    controller = module.get<LeaveTypeController>(LeaveTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
