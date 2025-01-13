import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateProductDto implements Prisma.ProductUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a unique product code"})
    productCode: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a title"})
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide"})
    @Type(() => Number)
    quantity?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide"})
    @Type(() => Number)
    unitPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    accountId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    taxRateId?: number;
}
