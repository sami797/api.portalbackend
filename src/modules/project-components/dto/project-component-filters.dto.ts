import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ProjectComponentFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    title: string

    @ApiPropertyOptional()
    @IsOptional()
    slug: string
}