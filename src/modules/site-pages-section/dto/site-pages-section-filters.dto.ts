import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsOptional } from "class-validator";

export class SitePagesSectionFiltersDto implements Prisma.PagesSectionWhereInput {
    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    slug?: string
}