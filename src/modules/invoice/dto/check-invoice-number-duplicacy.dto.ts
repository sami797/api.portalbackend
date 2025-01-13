import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CheckInvoiceDuplicacyDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid invoice number"})
    invoiceNumber: string

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    excludeId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectId: number;
}