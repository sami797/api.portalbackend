import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';

export class FaqsCategoryFiltersDto{

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isRoot?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    parentId: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    forAdminpanel?: boolean;
}