import { ApiPropertyOptional } from '@nestjs/swagger';
import { Blogs } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BlogsCategory, BlogsStatus } from 'src/config/constants';

export class BlogsFiltersDto implements Partial<Blogs>{

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(BlogsStatus)
    @Type(() => Number)
    status?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(BlogsCategory)
    @Type(() => Number)
    category?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    countryIds?: number | number[];
}

export class BlogsPublicFiltersDto{

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    excludeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(BlogsCategory)
    @Type(() => Number)
    category?: number;

    @ApiPropertyOptional()
    @IsOptional()
    blogCategorySlug?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() =>  Number)
    blogCategoryId?: number;

}