import { Test, TestingModule } from '@nestjs/testing';
import { PermitsService } from './permits.service';

describe('PermitsService', () => {
  let service: PermitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermitsService],
    }).compile();

    service = module.get<PermitsService>(PermitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
