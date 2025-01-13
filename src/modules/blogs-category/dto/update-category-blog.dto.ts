import { PartialType } from '@nestjs/swagger';
import { CreateBlogCategoryDto } from './create-category-blog.dto';

export class UpdateBlogCategoryDto extends PartialType(CreateBlogCategoryDto) {}
