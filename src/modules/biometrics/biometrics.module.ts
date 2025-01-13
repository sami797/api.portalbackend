import { Module } from '@nestjs/common';
import { BiometricsService } from './biometrics.service';
import { BiometricsController } from './biometrics.controller';
import { BiometricsAuthorizationService } from './biometrics.authorization.service';
import { CoordinatesService } from './coordinates.service';

@Module({
  controllers: [BiometricsController],
  providers: [CoordinatesService, BiometricsService, BiometricsAuthorizationService]
})
export class BiometricsModule {}
