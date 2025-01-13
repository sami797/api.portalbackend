import { ApiPropertyOptional } from "@nestjs/swagger";
import { Project } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsDateString, IsEnum, IsInt, IsOptional } from "class-validator";
import { ProjectRole } from "src/config/constants";
import { ParseBoolean, ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class ProjectFiltersDto implements Partial<Project> {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    projectStateId?: number;

    @ApiPropertyOptional({isArray: true})
    @IsOptional()
    @IsArray()
    projectStateSlugs?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isClosed?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    delayed?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    onHold?: boolean;

    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @Type(() => Number)
    @IsArray()
    userIds?: number[];

    @ApiPropertyOptional({enum: ProjectRole})
    @IsOptional()
    @IsEnum(ProjectRole)
    @Type(() => Number)
    projectRole?: number;

    @ApiPropertyOptional({type: "date"})
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    fromDate?: Date;
}