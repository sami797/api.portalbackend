import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsUrl, IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';

export class CreateSitePageDto implements Prisma.SitePagesUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({ message: "Please give shortcut a name" })
    @IsString()
    title: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide a valid slug" })
    @SlugifyString()
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    pageSectionIds?: number[];

}
