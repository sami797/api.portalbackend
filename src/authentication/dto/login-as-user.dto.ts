import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class LoginAsUser {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid user ID"})
    @IsNumber()
    @Type(() => Number)
    userId: number
}