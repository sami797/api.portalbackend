import { Prisma } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';
import { ValidateNested, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsArray, ArrayMinSize, Min, IsInt } from 'class-validator';
import { SlugifyString } from "src/helpers/class-transformer-custom-decorator";

export class CreateBlogCategoryDto implements Prisma.BlogsCategoryCreateInput{

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide the package slug" })
    @SlugifyString()
    slug: string;

    @ApiProperty({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    image?: string;

    @ApiPropertyOptional()
    @IsOptional()
    imageAlt: string;

    @ApiProperty()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    highlight?: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

}
