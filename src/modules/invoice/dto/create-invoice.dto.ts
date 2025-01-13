import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { InvoiceType } from "src/config/constants";
import { ParseBoolean, ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";
import { TypeFromEnumValues } from "src/helpers/common";

export class InvoiceItem implements Partial<Prisma.InvoiceItemUncheckedCreateInput> {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    id: number;
    
    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid title"})
    title?: string;

    @ApiProperty()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    quantity?: number = 1;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid amount"})
    @IsNumber()
    @Type(() => Number)
    amount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    productId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    accountId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    taxRateId: number;
}

export class CreateInvoiceDto implements Prisma.InvoiceUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please choose a project"})
    title?: string;

    @ApiPropertyOptional()
    @IsNotEmpty({message: "Please provide quote number"})
    invoiceNumber: string;
    
    @ApiProperty()
    @IsNotEmpty({message: "Please choose a project"})
    @Type(() => Number)
    projectId?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose a Quotation"})
    @Type(() => Number)
    quotationId?: number;

    @ApiProperty({enum: InvoiceType})
    @IsNotEmpty({message: "Please provide valid data"})
    @Type(() => Number)
    @IsEnum(InvoiceType)
    type?: TypeFromEnumValues<typeof InvoiceType>;

    @ApiProperty({ isArray: true, type: InvoiceItem })
    @IsNotEmpty({ message: "Please provide the invoice items" })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => InvoiceItem)
    invoiceItems: Array<InvoiceItem>;

    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    file?: string;

    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @ParseCustomNumberArray()
    milestoneIds: number | Array<number>

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    hasSupervisionCharge?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    issueDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiryDate?: Date;
}
