import { PartialType } from '@nestjs/swagger';
import { CreateDashboardElementDto } from './create-dashboard-element.dto';

export class UpdateDashboardElementDto extends PartialType(CreateDashboardElementDto) {}
