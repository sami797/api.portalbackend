import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty } from "class-validator";
import { IsDateGreaterThan } from "src/helpers/class-validator-custom-decorators";

export class CreatePayrollCycleDto implements Prisma.PayrollCycleUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please choose from date"})
    @IsDate()
    @Type(() => Date)
    fromDate?: Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose from date"})
    @IsDateGreaterThan('fromDate', {message: "To date must be greater than From Date"})
    @IsDate()
    @Type(() => Date)
    toDate?: Date;
}
