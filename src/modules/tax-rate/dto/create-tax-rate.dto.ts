import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateTaxRateDto implements Prisma.TaxRateUncheckedCreateInput {
    @ApiPropertyOptional()
    @IsOptional({message:"Please provide taxType from Xero"})
    taxType: string;

    @ApiProperty()
    @IsNotEmpty({message:"Please provide a title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty({message:"Please provide a rate"})
    @Type(() => Number)
    rate?: number;
}
