import { PartialType } from '@nestjs/swagger';
import { CreateSitePagesContentDto } from './create-site-pages-content.dto';

export class UpdateSitePagesContentDto extends PartialType(CreateSitePagesContentDto) {}
