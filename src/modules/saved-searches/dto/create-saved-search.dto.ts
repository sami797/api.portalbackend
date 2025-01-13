import { Prisma, SavedSearchesVisibility } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsEnum, IsNotEmpty, IsOptional, IsArray, Min, IsInt, IsString, Max } from 'class-validator';
import { ParseJson } from "src/helpers/class-transformer-custom-decorator";
import { SavedSearchesFilterTypes } from "../types/saved-searches.types";

export class SavedSearchesFiltersInput implements SavedSearchesFilterTypes {

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    category?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Type(() => String)
    type?: string;

}

export class CreateSavedSearchDto implements Prisma.SavedSearchesCreateInput{

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


    @ApiPropertyOptional({type: SavedSearchesFiltersInput })
    @IsOptional()
    @ValidateNested()
    @Type(() => SavedSearchesFiltersInput)
    @ParseJson()
    savedSearchesFilters?: SavedSearchesFiltersInput;

}
