import { Test, TestingModule } from '@nestjs/testing';
import { SitePagesController } from './site-pages.controller';
import { SitePagesService } from './site-pages.service';

describe('SitePagesController', () => {
  let controller: SitePagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitePagesController],
      providers: [SitePagesService],
    }).compile();

    controller = module.get<SitePagesController>(SitePagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
