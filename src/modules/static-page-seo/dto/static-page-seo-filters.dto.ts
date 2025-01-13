import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class StaticPageSEOFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    sitePageId: number;

}