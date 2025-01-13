import { ApiProperty } from '@nestjs/swagger';
import { SMSType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ParseCustomNumberArray } from 'src/helpers/class-transformer-custom-decorator';

export class TestSMSDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the phone code"})
    phoneCode: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the phone number"})
    phone: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter your message"})
    @MaxLength(100)
    message: string;


    @ApiProperty()
    @IsNotEmpty({message: "Please choose the sms type"})
    @IsEnum(SMSType)
    smsType: SMSType;
}
