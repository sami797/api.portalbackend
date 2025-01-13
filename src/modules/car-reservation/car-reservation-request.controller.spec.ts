import { Test, TestingModule } from '@nestjs/testing';
import { CarReservationRequestController } from './car-reservation-request.controller';
import { CarReservationRequestService } from './car-reservation-request.service';

describe('CompanyCarRequestController', () => {
  let controller: CarReservationRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarReservationRequestController],
      providers: [CarReservationRequestService],
    }).compile();

    controller = module.get<CarReservationRequestController>(CarReservationRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
