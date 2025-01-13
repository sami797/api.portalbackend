import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class ProjectEnableStateFiltersDto {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    id: number

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectStateIds: number[];
  
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectId: number;
}