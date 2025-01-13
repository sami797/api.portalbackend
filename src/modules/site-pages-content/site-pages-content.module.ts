import { Module } from '@nestjs/common';
import { SitePagesContentService } from './site-pages-content.service';
import { SitePagesContentController } from './site-pages-content.controller';

@Module({
  controllers: [SitePagesContentController],
  providers: [SitePagesContentService]
})
export class SitePagesContentModule {}
