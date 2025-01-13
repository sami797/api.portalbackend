import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class UploadLeadDocuments {

    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    files: string;

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please provide lead Id"})
    @IsNumber()
    @Type(() => Number)
    leadId : number;    
}