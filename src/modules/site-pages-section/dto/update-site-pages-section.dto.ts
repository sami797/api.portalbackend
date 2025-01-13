import { PartialType } from '@nestjs/swagger';
import { CreateSitePagesSectionDto } from './create-site-pages-section.dto';

export class UpdateSitePagesSectionDto extends PartialType(CreateSitePagesSectionDto) {}
