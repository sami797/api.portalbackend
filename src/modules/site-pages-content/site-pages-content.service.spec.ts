import { Test, TestingModule } from '@nestjs/testing';
import { SitePagesContentService } from './site-pages-content.service';

describe('SitePagesContentService', () => {
  let service: SitePagesContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SitePagesContentService],
    }).compile();

    service = module.get<SitePagesContentService>(SitePagesContentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
