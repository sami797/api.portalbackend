import { PartialType } from '@nestjs/swagger';
import { CreateBiometricDto } from './create-biometric.dto';

export class UpdateBiometricDto extends PartialType(CreateBiometricDto) {}
