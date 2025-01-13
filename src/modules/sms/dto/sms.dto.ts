import { ApiProperty } from "@nestjs/swagger";
import { SmsConfiguration } from "@prisma/client";
import { ResponseSuccess } from "src/common-types/common-types";

export class SMSResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: SmsConfiguration
}

export class SMSResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: SmsConfiguration
}