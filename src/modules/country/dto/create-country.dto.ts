import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional} from 'class-validator';
import { ParseBoolean, ParseJson } from 'src/helpers/class-transformer-custom-decorator';

export class CreateCountryDto implements Prisma.CountryCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the country name"})
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    vat?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the country ISO code"})
    isoCode: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the country short name"})
    shortName: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the country display name"})
    displayName: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the country phone code"})
    phoneCode: string;

    @ApiProperty({required: false})
    @IsOptional()
    flag?: string;

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please provide the default currency for the country"})
    @Type(() => Number)
    defaultCurrency: number;
    
    @ApiProperty({required: false, type:'integer',isArray:true})
    @IsOptional()
    @Type(() => Number)
    @IsNumber({},{each: true})
    enabledLanguages?: number[];

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please provide the default language for the country"})
    @Type(() => Number)
    @IsInt()
    defaultLanguage: number;

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please provide the default area unit for the country"})
    @Type(() => Number)
    @IsInt()
    defaultAreaUnit: number;

    @ApiProperty({default: true, required: false})
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

}
