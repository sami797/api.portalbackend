import { Test, TestingModule } from '@nestjs/testing';
import { SitePagesSectionController } from './site-pages-section.controller';
import { SitePagesSectionService } from './site-pages-section.service';

describe('SitePagesSectionController', () => {
  let controller: SitePagesSectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitePagesSectionController],
      providers: [SitePagesSectionService],
    }).compile();

    controller = module.get<SitePagesSectionController>(SitePagesSectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
