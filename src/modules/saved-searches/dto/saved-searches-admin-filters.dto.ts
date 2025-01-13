import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { ParseBoolean, ParseJson } from 'src/helpers/class-transformer-custom-decorator';
import { SavedSearchesFiltersInput } from './create-saved-search.dto';
import { ProjectFiltersDto } from 'src/modules/project/dto/project-filters.dto';

export class SavedSearchesAdminFiltersDto{
    userIds?: number | number[];

    organizationId?: number;

    @ApiPropertyOptional({type: ProjectFiltersDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ProjectFiltersDto)
    @ParseJson()
    savedSearchesFilters?: ProjectFiltersDto;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;
}
