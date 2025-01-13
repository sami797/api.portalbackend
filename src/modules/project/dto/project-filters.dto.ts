import { ApiPropertyOptional } from "@nestjs/swagger";
import { Project } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional } from "class-validator";
import { ProjectRole } from "src/config/constants";
import { ParseBoolean, ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class ProjectFiltersDto implements Partial<Project> {
    @ApiPropertyOptional()
    @IsOptional()
    title: string

    @ApiPropertyOptional()
    @IsOptional()
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseCustomNumberArray()
    ids: number | number[];

    @ApiPropertyOptional()
    @IsOptional()
    quoteNumber: string;

    @ApiPropertyOptional()
    @IsOptional()
    invoiceNumber: string;

    @ApiPropertyOptional()
    @IsOptional()
    referenceNumber: string;

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
    @Type(() => Number)
    @IsInt()
    clientId?: number;

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

    @ApiPropertyOptional({type: "date"})
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({type: "date"})
    @IsOptional()
    @IsDateString()
    toDate?: string;

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
}