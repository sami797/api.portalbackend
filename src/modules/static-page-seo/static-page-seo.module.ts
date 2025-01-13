import { Module } from '@nestjs/common';
import { StaticPageSeoService } from './static-page-seo.service';
import { StaticPageSeoController } from './static-page-seo.controller';

@Module({
  controllers: [StaticPageSeoController],
  providers: [StaticPageSeoService]
})
export class StaticPageSeoModule {}
