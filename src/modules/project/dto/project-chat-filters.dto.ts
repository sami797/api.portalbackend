import { ApiPropertyOptional } from "@nestjs/swagger";
import { Project } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional } from "class-validator";
import { ProjectRole } from "src/config/constants";
import { ParseBoolean, ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class ProjectChatFiltersDto implements Partial<Project> {
    @ApiPropertyOptional()
    @IsOptional()
    title: string

    @ApiPropertyOptional()
    @IsOptional()
    @ParseCustomNumberArray()
    id: number;
}