import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsOptional } from "class-validator";

export class SitePagesFiltersDto implements Prisma.SitePagesWhereInput {
    @ApiPropertyOptional()
    @IsOptional()
    title?: string;
}