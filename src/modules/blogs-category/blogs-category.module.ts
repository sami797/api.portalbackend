import { Module } from '@nestjs/common';
import { BlogsCategoryService } from './blogs-category.service';
import { BlogsCategoryController } from './blogs-category.controller';
import { AuthorizationService } from 'src/authorization/authorization.service';

@Module({
  controllers: [BlogsCategoryController],
  providers: [BlogsCategoryService, AuthorizationService]
})
export class BlogsCategoryModule {}
