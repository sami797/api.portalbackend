import { Test, TestingModule } from '@nestjs/testing';
import { CarReservationRequestService } from './car-reservation-request.service';

describe('LeaveRequestService', () => {
  let service: CarReservationRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarReservationRequestService],
    }).compile();

    service = module.get<CarReservationRequestService>(CarReservationRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
