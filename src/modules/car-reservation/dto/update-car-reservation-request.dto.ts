import { PartialType } from '@nestjs/swagger';
import { CreateCarReservationRequestDto } from './create-car-reservation.dto';

export class UpdateCarReservationRequestDto extends PartialType(CreateCarReservationRequestDto) {}
