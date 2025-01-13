import { Module } from '@nestjs/common';
import { UserAlertsSettingService } from './user-alerts-setting.service';
import { UserAlertsSettingController } from './user-alerts-setting.controller';

@Module({
  controllers: [UserAlertsSettingController],
  providers: [UserAlertsSettingService]
})
export class UserAlertsSettingModule {}
