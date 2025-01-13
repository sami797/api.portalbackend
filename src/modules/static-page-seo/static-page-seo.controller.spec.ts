import { Test, TestingModule } from '@nestjs/testing';
import { StaticPageSeoController } from './static-page-seo.controller';
import { StaticPageSeoService } from './static-page-seo.service';

describe('StaticPageSeoController', () => {
  let controller: StaticPageSeoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaticPageSeoController],
      providers: [StaticPageSeoService],
    }).compile();

    controller = module.get<StaticPageSeoController>(StaticPageSeoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
