import { Test, TestingModule } from '@nestjs/testing';
import { SitePagesSectionService } from './site-pages-section.service';

describe('SitePagesSectionService', () => {
  let service: SitePagesSectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SitePagesSectionService],
    }).compile();

    service = module.get<SitePagesSectionService>(SitePagesSectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
