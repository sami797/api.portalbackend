import { Test, TestingModule } from '@nestjs/testing';
import { UserAlertsSettingController } from './user-alerts-setting.controller';
import { UserAlertsSettingService } from './user-alerts-setting.service';

describe('UserAlertsSettingController', () => {
  let controller: UserAlertsSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAlertsSettingController],
      providers: [UserAlertsSettingService],
    }).compile();

    controller = module.get<UserAlertsSettingController>(UserAlertsSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
