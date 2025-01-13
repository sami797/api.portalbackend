import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty } from "class-validator";
import { CompanyAssetType } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

// type CompanyAssetStatus = typeof CompanyAssetType[keyof typeof CompanyAssetType];
type EnumValue<T extends Record<string, number>> = T[keyof T];

export class CreateCompanyAssetDto implements Prisma.CompanyAssetUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty()
    code?: string;

    @ApiProperty({enum: CompanyAssetType})
    @IsNotEmpty()
    @Type(() => Number)
    @IsEnum(CompanyAssetType)
    type?: number

    @ApiProperty()
    @IsNotEmpty()
    assetName?: string;

    @ApiProperty()
    @IsNotEmpty()
    assetDetail?: string;

    @ApiProperty()
    @IsNotEmpty()
    @Type(() => Number)
    quantity?: number;
}
