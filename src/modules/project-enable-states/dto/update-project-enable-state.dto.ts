import { PartialType } from '@nestjs/swagger';
import { CreateProjectEnableStateDto } from './create-project-enable-state.dto';

export class UpdateProjectEnableStateDto extends PartialType(CreateProjectEnableStateDto) {}
