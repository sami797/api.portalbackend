import { Test, TestingModule } from '@nestjs/testing';
import { BiometricsJobController } from './biometrics-job.controller';
import { BiometricsJobService } from './biometrics-job.service';

describe('BiometricsJobController', () => {
  let controller: BiometricsJobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiometricsJobController],
      providers: [BiometricsJobService],
    }).compile();

    controller = module.get<BiometricsJobController>(BiometricsJobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
