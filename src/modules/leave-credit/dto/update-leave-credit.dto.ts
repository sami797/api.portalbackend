import { PartialType } from '@nestjs/swagger';
import { CreateLeaveCreditDto } from './create-leave-credit.dto';

export class UpdateLeaveCreditDto extends PartialType(CreateLeaveCreditDto) {}
