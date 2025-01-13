import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNotIn } from "class-validator";
import { EnquiryStatus } from "src/config/constants";

export class EnquiryStatusDto {
    @ApiProperty({enum: [EnquiryStatus.Spam, EnquiryStatus.Unqualified]})
    @IsNotEmpty({message: "Please choose a status"})
    @IsEnum([EnquiryStatus.Spam, EnquiryStatus.Unqualified])
    status: number;
}