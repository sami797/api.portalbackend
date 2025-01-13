import { ApiPropertyOptional } from "@nestjs/swagger";
import { Invoice } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsOptional } from "class-validator";
import { InvoiceStatus } from "src/config/constants";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";
import { IsEnumArray } from "src/helpers/class-validator-custom-decorators";
import { TypeFromEnumValues } from "src/helpers/common";

export class InvoiceFiltersDto implements Partial<Invoice> {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    clientId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    id?: number;

    @ApiPropertyOptional()
    @IsOptional()
    invoiceNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectTypeId?: number;

    @ApiPropertyOptional({enum: InvoiceStatus, isArray: true})
    @IsOptional()
    @IsEnumArray(InvoiceStatus)
    @IsArray()
    @Type(() => Number)
    __status?: TypeFromEnumValues<typeof InvoiceStatus>[]; 
    
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
    @ParseBoolean()
    hasConcerns?: boolean;
}