import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class UploadTaskFiles implements Prisma.FileManagementUncheckedCreateInput {

    @ApiProperty({type: "file", isArray: true})
    @Exclude()
    files: string;

    @Exclude()
    file: string;

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please provide property Id"})
    @IsNumber()
    @Type(() => Number)
    taskId : number;

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;
    
}