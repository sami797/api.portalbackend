import { Prisma, SavedSearchesVisibility } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsEnum, IsNotEmpty, IsOptional, IsArray, Min, IsInt, IsString, Max } from 'class-validator';
import { ParseJson } from "src/helpers/class-transformer-custom-decorator";
import { ProjectFiltersDto } from "src/modules/project/dto/project-filters.dto";

export class CreateAdminSavedSearchDto implements Prisma.SavedSearchesCreateInput{

    @ApiProperty()
    @IsNotEmpty({message: "Please enter a title"})
    @IsString()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({enum: SavedSearchesVisibility})
    @IsOptional()
    @IsEnum(SavedSearchesVisibility)
    visibility?: SavedSearchesVisibility = 'self';


    @ApiPropertyOptional({type: ProjectFiltersDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ProjectFiltersDto)
    @ParseJson()
    savedSearchesFilters?: ProjectFiltersDto;

}
