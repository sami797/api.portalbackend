import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class UploadFaqImage {

    @ApiProperty({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    file: string;

    @ApiProperty({required: false})
    @IsNotEmpty({message: "Please provide a blogId"})
    @IsNumber()
    @Type(() => Number)
    faqId: number;
}