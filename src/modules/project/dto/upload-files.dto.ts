import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ProjectDocumentsTypes } from "../entities/project.entity";

export class UploadProjectFiles implements Prisma.FileManagementCreateInput {

    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    files: string;

    @Exclude()
    file: string;

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please provide property Id"})
    @IsNumber()
    @Type(() => Number)
    projectId : number;

    @ApiProperty({required: true, enum: ProjectDocumentsTypes})
    @IsNotEmpty({message: "Please provide document type"})
    @IsEnum(ProjectDocumentsTypes)
    documentType  : ProjectDocumentsTypes;

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;
    
}