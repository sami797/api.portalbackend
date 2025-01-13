import { PartialType } from '@nestjs/swagger';
import { CreateWorkingHourDto } from './create-working-hour.dto';

export class UpdateWorkingHourDto extends PartialType(CreateWorkingHourDto) {}
