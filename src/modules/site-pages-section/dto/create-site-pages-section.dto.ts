import { Prisma } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {  IsNotEmpty, IsUrl, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';
export class CreateSitePagesSectionDto implements Prisma.PagesSectionCreateInput {


    @ApiProperty()
    @IsNotEmpty({message: "Please give shortcut a name"})
    @IsString()
    title: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid slug"})
    @SlugifyString()
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

    @ApiProperty({default: true, required : false})
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;
}
