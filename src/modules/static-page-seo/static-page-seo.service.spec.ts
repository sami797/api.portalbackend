import { Test, TestingModule } from '@nestjs/testing';
import { StaticPageSeoService } from './static-page-seo.service';

describe('StaticPageSeoService', () => {
  let service: StaticPageSeoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StaticPageSeoService],
    }).compile();

    service = module.get<StaticPageSeoService>(StaticPageSeoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
