import { PartialType } from '@nestjs/swagger';
import { CreateCompanyAssetDto } from './create-company-asset.dto';

export class UpdateCompanyAssetDto extends PartialType(CreateCompanyAssetDto) {}
