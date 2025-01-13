import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MinLength } from "class-validator";

export class ResetUserPassword {
    @ApiProperty()
    @IsNotEmpty({message: "Please set your new password. Password cannot be empty"})
    @MinLength(4)
    password: string
}