import { Test, TestingModule } from '@nestjs/testing';
import { PublicHolidayController } from './public-holiday.controller';
import { PublicHolidayService } from './public-holiday.service';

describe('PublicHolidayController', () => {
  let controller: PublicHolidayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicHolidayController],
      providers: [PublicHolidayService],
    }).compile();

    controller = module.get<PublicHolidayController>(PublicHolidayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
