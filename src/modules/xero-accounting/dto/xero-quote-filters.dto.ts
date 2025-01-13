import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";
import { QuoteStatusCodes } from "xero-node";

export class XeroQuoteFiltersDto {
    // @ApiPropertyOptional()
    // @IsOptional()
    // ifModifiedSince?: Date = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // dateFrom?: string = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // dateTo?: string = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // expiryDateFrom?: string = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // expiryDateTo?: string = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // contactID?: string = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // status?: string = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // page?: number = null;

    // @ApiPropertyOptional()
    // @IsOptional()
    // order?: string = null;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide a quote number" })
    quoteNumber?: string = null;

    @ApiProperty()
    @IsNotEmpty({ message: "Please select organization" })
    tenantId?: string = null;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    force?: boolean
}