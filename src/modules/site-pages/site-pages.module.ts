import { Module } from '@nestjs/common';
import { SitePagesService } from './site-pages.service';
import { SitePagesController } from './site-pages.controller';

@Module({
  controllers: [SitePagesController],
  providers: [SitePagesService]
})
export class SitePagesModule {}
