import { ApiPropertyOptional } from "@nestjs/swagger";
import { BiometricsChecks, BiometricsChecksType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { BiometricsEntryType } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export class BiometricsFilters implements Partial<BiometricsChecks> {
    @ApiPropertyOptional({enum: BiometricsChecksType})
    @IsOptional()
    @IsEnum(BiometricsChecksType)
    mode: BiometricsChecksType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional({enum: BiometricsEntryType})
    @IsOptional()
    @Type(() => Number)
    @IsEnum(BiometricsEntryType)
    type: TypeFromEnumValues<typeof BiometricsEntryType>;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    userId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    organizationId: number;

}