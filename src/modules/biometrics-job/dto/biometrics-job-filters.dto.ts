import { ApiPropertyOptional } from "@nestjs/swagger";
import { BiometricsJob } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsOptional } from "class-validator";

export class BiometricsJobFilters implements Partial<BiometricsJob> {

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    status: number;

}