import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class SuspendOrganizationDto {

    @ApiProperty()
    @IsNotEmpty({message: "Please give a reason why you want to suspend the organization"})
    message: string
    
}