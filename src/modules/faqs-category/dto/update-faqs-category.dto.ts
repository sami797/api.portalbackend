import { PartialType } from '@nestjs/swagger';
import { CreateFaqsCategoryDto } from './create-faqs-category.dto';

export class UpdateFaqsCategoryDto extends PartialType(CreateFaqsCategoryDto) {}
