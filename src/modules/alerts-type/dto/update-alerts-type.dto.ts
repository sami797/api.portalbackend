import { PartialType } from '@nestjs/swagger';
import { CreateAlertsTypeDto } from './create-alerts-type.dto';

export class UpdateAlertsTypeDto extends PartialType(CreateAlertsTypeDto) {}
