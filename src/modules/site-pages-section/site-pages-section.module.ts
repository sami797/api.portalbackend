import { Module } from '@nestjs/common';
import { SitePagesSectionService } from './site-pages-section.service';
import { SitePagesSectionController } from './site-pages-section.controller';

@Module({
  controllers: [SitePagesSectionController],
  providers: [SitePagesSectionService]
})
export class SitePagesSectionModule {}
