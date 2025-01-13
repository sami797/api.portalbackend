import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class AuthorityFiltersDto {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    id: number

    @ApiPropertyOptional()
    @IsOptional()
    title: string

    @ApiPropertyOptional()
    @IsOptional()
    slug: string
}