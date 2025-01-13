import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, MinLength } from "class-validator";

export class EmailSignupDto implements Partial<Prisma.UserUncheckedCreateInput> {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter first name"})
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter last name"})
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsOptional({message: "Please enter your email"})
    @IsEmail()
    email: string;

    @ApiProperty()
    phone?: string;

    @ApiProperty()
    phoneCode?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please create a passowrd"})
    @MinLength(4)
    password: string;
}

export class PhoneSignupDto implements Partial<Prisma.UserUncheckedCreateInput> {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter first name"})
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter last name"})
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter your email"})
    @IsEmail()
    email: string;

    @ApiProperty()
    phone?: string;

    @ApiProperty()
    phoneCode?: string;

    @ApiProperty()
    @IsOptional({message: "Please enter a passowrd"})
    @MinLength(4)
    password: string;
}

export class LoginSignUpByPhone  {

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