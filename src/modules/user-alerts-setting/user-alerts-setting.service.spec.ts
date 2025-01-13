import { Test, TestingModule } from '@nestjs/testing';
import { UserAlertsSettingService } from './user-alerts-setting.service';

describe('UserAlertsSettingService', () => {
  let service: UserAlertsSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserAlertsSettingService],
    }).compile();

    service = module.get<UserAlertsSettingService>(UserAlertsSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
