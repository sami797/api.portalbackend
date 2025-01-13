import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { UserDocumentsTypes } from "../types/user.types";

export class UpdateUserDocuments implements Prisma.UserDocumentUpdateInput{

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please provide document Id"})
    @IsNumber()
    @Type(() => Number)
    documentId : number;

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

    @ApiProperty({required: true, enum: UserDocumentsTypes})
    @IsNotEmpty({message: "Please provide document type"})
    @IsEnum(UserDocumentsTypes)
    documentType  : UserDocumentsTypes;
    
}