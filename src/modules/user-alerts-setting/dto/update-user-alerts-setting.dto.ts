import { PartialType } from '@nestjs/swagger';
import { CreateUserAlertsSettingDto } from './create-user-alerts-setting.dto';

export class UpdateUserAlertsSettingDto extends PartialType(CreateUserAlertsSettingDto) {}
