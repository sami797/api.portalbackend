import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class UserSalaryDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter a salary amount"})
    @Type(() => Number)
    amount: number

    @ApiProperty()
    @IsNotEmpty({message: "Please choose start date"})
    @Type(() => Date)
    startDate: Date
}