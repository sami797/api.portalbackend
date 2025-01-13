import { PartialType } from '@nestjs/swagger';
import { CreateSitePageDto } from './create-site-page.dto';

export class UpdateSitePageDto extends PartialType(CreateSitePageDto) {}
