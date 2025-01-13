import { ApiPropertyOptional } from '@nestjs/swagger';
import { BlogsCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { BlogsCategoryStatus } from 'src/config/constants';

export class BlogsCategoryFiltersDto implements Partial<BlogsCategory>{

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(BlogsCategoryStatus)
    @Type(() => Number)
    status?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    countryIds?: number | number[];
}

export class BlogsCategoryPublicFiltersDto{
    @ApiPropertyOptional()
    @IsOptional()
    title?: string;
}