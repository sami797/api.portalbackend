import { Test, TestingModule } from '@nestjs/testing';
import { PublicHolidayService } from './public-holiday.service';

describe('PublicHolidayService', () => {
  let service: PublicHolidayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicHolidayService],
    }).compile();

    service = module.get<PublicHolidayService>(PublicHolidayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
