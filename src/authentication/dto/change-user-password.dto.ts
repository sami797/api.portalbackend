import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MinLength } from "class-validator";

export class ChangeUserPassword {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter the valid password"})
    password: string

    @ApiProperty()
    @IsNotEmpty({message: "Please set your new password. Password cannot be empty"})
    @MinLength(4)
    newPassword: string
}