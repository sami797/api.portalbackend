import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ValidateUserEmail {

    @ApiProperty()
    @IsNotEmpty({message: "Please enter your email"})
    @IsEmail()
    email: string;
    
}