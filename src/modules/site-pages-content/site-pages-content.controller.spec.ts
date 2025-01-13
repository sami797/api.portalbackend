import { Test, TestingModule } from '@nestjs/testing';
import { SitePagesContentController } from './site-pages-content.controller';
import { SitePagesContentService } from './site-pages-content.service';

describe('SitePagesContentController', () => {
  let controller: SitePagesContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitePagesContentController],
      providers: [SitePagesContentService],
    }).compile();

    controller = module.get<SitePagesContentController>(SitePagesContentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
