import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CompanyAsset } from "@prisma/client";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class CompanyAssetFiltersDto implements Partial<CompanyAsset> {
    @ApiPropertyOptional()
    @IsOptional()
    code: string;

    @ApiPropertyOptional()
    @IsOptional()
    assetName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    type: number;
}