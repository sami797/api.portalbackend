import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {  IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class ProjectCommentAndNotesFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    message?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide project ID"})
    @Type(() => Number)
    @IsInt()
    projectId?: number
}