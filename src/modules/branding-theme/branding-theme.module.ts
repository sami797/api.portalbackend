import { Module } from '@nestjs/common';
import { BrandingThemeService } from './branding-theme.service';
import { BrandingThemeController } from './branding-theme.controller';

@Module({
  controllers: [BrandingThemeController],
  providers: [BrandingThemeService]
})
export class BrandingThemeModule {}
