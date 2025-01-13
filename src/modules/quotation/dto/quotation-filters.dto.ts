import { ApiPropertyOptional } from "@nestjs/swagger";
import { Quotation } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsOptional } from "class-validator";
import { QuotationStatus } from "src/config/constants";
import { IsEnumArray } from "src/helpers/class-validator-custom-decorators";

export class QuotationFiltersDto implements Partial<Quotation> {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    leadId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    id: number;

    @ApiPropertyOptional()
    @IsOptional()
    quoteNumber: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    clientId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectTypeId: number;

    @ApiPropertyOptional({enum: QuotationStatus, isArray: true})
    @IsOptional()
    @IsEnumArray(QuotationStatus)
    @IsArray()
    @Type(() => Number)
    __status: number[];
    
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
    assignedToId?: number;
}