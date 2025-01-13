import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { ProjectDocumentsTypes } from "../entities/project.entity";

export class UpdateProjectFiles{

    @ApiPropertyOptional({required: true, enum: ProjectDocumentsTypes})
    @IsOptional()
    @IsEnum(ProjectDocumentsTypes)
    documentType  : ProjectDocumentsTypes;

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;
    
}