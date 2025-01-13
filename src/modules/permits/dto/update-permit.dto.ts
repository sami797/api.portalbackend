import { PartialType } from '@nestjs/swagger';
import { CreatePermitDto } from './create-permit.dto';

export class UpdatePermitDto extends PartialType(CreatePermitDto) {}
