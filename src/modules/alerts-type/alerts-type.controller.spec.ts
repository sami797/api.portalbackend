import { Test, TestingModule } from '@nestjs/testing';
import { AlertsTypeController } from './alerts-type.controller';
import { AlertsTypeService } from './alerts-type.service';

describe('AlertsTypeController', () => {
  let controller: AlertsTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsTypeController],
      providers: [AlertsTypeService],
    }).compile();

    controller = module.get<AlertsTypeController>(AlertsTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
