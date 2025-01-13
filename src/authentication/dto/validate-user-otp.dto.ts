import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";

export class ValidateUserOtp  {

    @ApiProperty()
    @IsNotEmpty({message: "Please enter OTP code"})
    @MaxLength(10)
    otp: string

}