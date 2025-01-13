import { Module } from '@nestjs/common';
import { AlertsTypeService } from './alerts-type.service';
import { AlertsTypeController } from './alerts-type.controller';

@Module({
  controllers: [AlertsTypeController],
  providers: [AlertsTypeService]
})
export class AlertsTypeModule {}
