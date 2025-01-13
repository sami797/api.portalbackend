import { Test, TestingModule } from '@nestjs/testing';
import { BiometricsJobService } from './biometrics-job.service';

describe('BiometricsJobService', () => {
  let service: BiometricsJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BiometricsJobService],
    }).compile();

    service = module.get<BiometricsJobService>(BiometricsJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
