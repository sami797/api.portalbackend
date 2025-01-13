import { Test, TestingModule } from '@nestjs/testing';
import { SitePagesService } from './site-pages.service';

describe('SitePagesService', () => {
  let service: SitePagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SitePagesService],
    }).compile();

    service = module.get<SitePagesService>(SitePagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
