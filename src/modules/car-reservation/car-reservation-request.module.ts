import { Module } from '@nestjs/common';
import { CarReservationRequestService } from './car-reservation-request.service';
import { CarReservationRequestController } from './car-reservation-request.controller';
import { CarReservationAuthorizationService } from './car-reservation-request.authorization.service';

@Module({
  controllers: [CarReservationRequestController],
  providers: [CarReservationRequestService, CarReservationAuthorizationService]
})
export class CarReservationModule {}
