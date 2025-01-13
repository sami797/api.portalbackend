import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateOrganizationCommentsDto {

    @ApiProperty()
    @IsNotEmpty({message: "Please write your comments"})
    comment: string
    
}