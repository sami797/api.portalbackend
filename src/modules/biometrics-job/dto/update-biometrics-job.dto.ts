import { PartialType } from '@nestjs/swagger';
import { CreateBiometricsJobDto } from './create-biometrics-job.dto';

export class UpdateBiometricsJobDto extends PartialType(CreateBiometricsJobDto) {}
