import { ApiPropertyOptional } from '@nestjs/swagger';
import { Faqs } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';

export class FaqsFiltersDto implements Partial<Faqs>{

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    faqsCategoryId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    faqsCategorySlug?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    forAdminpanel?: boolean; 
}