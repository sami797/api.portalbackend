import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Exclude, Transform, Type } from 'class-transformer';
import { ValidateNested, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';


export class CreateSitePagesContentDto implements Prisma.PagesContentUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    highlight?: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose a page section"})
    @Type(() => Number)
    pageSectionId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    countryId?: number;

    @ApiProperty({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    image?: string;


    @ApiProperty({required: false})
    @IsOptional()
    imageAlt?: string;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isDefault?: number;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

}
