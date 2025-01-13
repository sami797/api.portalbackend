import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { ProjectDocumentsTypes } from "../entities/project.entity";
import { FileTypes } from "src/helpers/file-upload.utils";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class ProjectResourcesFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    fileName?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid project ID"})
    @Type(() => Number)
    @IsInt()
    projectId?: number
    
    @ApiPropertyOptional({enum: FileTypes})
    @IsOptional()
    @IsEnum(FileTypes)
    fileType?: keyof typeof FileTypes;

    @ApiPropertyOptional({enum: ProjectDocumentsTypes})
    @IsOptional()
    @IsEnum(ProjectDocumentsTypes)
    projectDocumentsTypes?: keyof typeof ProjectDocumentsTypes;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    sharedToClient: boolean

}