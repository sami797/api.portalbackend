import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, Max, MaxLength, MinLength } from "class-validator";

export class UpdateUserEmailRequest {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter the valid email"})
    @IsEmail()
    email: string
}

export class ValidateUserEmailOtp {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter the valid email"})
    @IsEmail()
    email: string

    @ApiProperty()
    @IsNotEmpty({message: "Please enter OTP code"})
    @MaxLength(10)
    otp: string
}

export class UpdateUserPhoneRequest  {

    @ApiProperty()
    @IsNotEmpty({message: "Please enter your phone"})
    @Max(999999999999)
    @IsInt()
    @Type(() => Number)
    phone: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter your phone code"})
    @Max(9999)
    @IsInt()
    @Type(() => Number)
    phoneCode: number;

}


export class ValidateUserPhoneOtp  {

    @ApiProperty()
    @IsNotEmpty({message: "Please enter your phone"})
    @Max(999999999999)
    @IsInt()
    @Type(() => Number)
    phone: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter your phone code"})
    @Max(9999)
    @IsInt()
    @Type(() => Number)
    phoneCode: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter OTP code"})
    @MaxLength(10)
    otp: string

}