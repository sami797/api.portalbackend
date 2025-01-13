import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { QuotationStatus } from "src/config/constants";

type QuotationStatusAcceptedType = QuotationStatus.confirmed | QuotationStatus.rejected 
const QuotationStatusAccepted = [QuotationStatus.confirmed, QuotationStatus.rejected];
export class QuotationStatusDto {
    @ApiProperty({enum: QuotationStatusAccepted})
    @IsNotEmpty({message: "Please choose a status"})
    @IsEnum(QuotationStatusAccepted)
    status: QuotationStatusAcceptedType
}