import { PartialType } from '@nestjs/swagger';
import { CreateBrandingThemeDto } from './create-branding-theme.dto';

export class UpdateBrandingThemeDto extends PartialType(CreateBrandingThemeDto) {}
