import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class TaxRateFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    tenantId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    leadId?: number;
}