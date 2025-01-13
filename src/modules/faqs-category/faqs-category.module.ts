import { Module } from '@nestjs/common';
import { FaqsCategoryService } from './faqs-category.service';
import { FaqsCategoryController } from './faqs-category.controller';

@Module({
  controllers: [FaqsCategoryController],
  providers: [FaqsCategoryService]
})
export class FaqsCategoryModule {}
