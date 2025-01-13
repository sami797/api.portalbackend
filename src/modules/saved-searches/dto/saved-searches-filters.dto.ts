import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { ParseBoolean, ParseJson } from 'src/helpers/class-transformer-custom-decorator';
import { SavedSearchesFiltersInput } from './create-saved-search.dto';

export class SavedSearchesFiltersDto{
    userIds?: number | number[];

    organizationId?: number;

    @ApiPropertyOptional({type: SavedSearchesFiltersInput })
    @IsOptional()
    @ValidateNested()
    @Type(() => SavedSearchesFiltersInput)
    @ParseJson()
    savedSearchesFilters?: SavedSearchesFiltersInput;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;
}
