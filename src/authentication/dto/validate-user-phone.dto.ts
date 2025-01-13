import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, Max, MaxLength } from "class-validator";

export class ValidateUserPhone  {

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