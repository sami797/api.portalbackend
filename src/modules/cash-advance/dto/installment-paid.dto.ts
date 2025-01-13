import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty } from "class-validator";

export class InstallmentPaidDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please choose paid date"})
    @Type(() => Date)
    @IsDate()
    paidDate: Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose installment id"})
    @Type(() => Number)
    installmentId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose cash advance id"})
    @Type(() => Number)
    cashAdvanceId: number;
}