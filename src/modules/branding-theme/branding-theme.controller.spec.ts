import { Test, TestingModule } from '@nestjs/testing';
import { BrandingThemeController } from './branding-theme.controller';
import { BrandingThemeService } from './branding-theme.service';

describe('BrandingThemeController', () => {
  let controller: BrandingThemeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandingThemeController],
      providers: [BrandingThemeService],
    }).compile();

    controller = module.get<BrandingThemeController>(BrandingThemeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
