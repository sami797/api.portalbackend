import { Test, TestingModule } from '@nestjs/testing';
import { BrandingThemeService } from './branding-theme.service';

describe('BrandingThemeService', () => {
  let service: BrandingThemeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrandingThemeService],
    }).compile();

    service = module.get<BrandingThemeService>(BrandingThemeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
