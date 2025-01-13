import { PartialType } from '@nestjs/swagger';
import { CreateStaticPageSeoDto } from './create-static-page-seo.dto';

export class UpdateStaticPageSeoDto extends PartialType(CreateStaticPageSeoDto) {}
