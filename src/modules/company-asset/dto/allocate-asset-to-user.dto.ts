import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class AllocateAssetToUserDto implements Prisma.AssetAllocationUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid user ID"})
    @Type(() => Number)
    userId: number

    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid user ID"})
    @Type(() => Number)
    companyAssetId: number

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    quantity: number = 1

    @ApiPropertyOptional()
    @IsOptional()
    label?: string;
}