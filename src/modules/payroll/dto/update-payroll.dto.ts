import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdatePayrollDto implements Prisma.PayrollUpdateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please enter the corrected days"})
    @Type(() => Number)
    manualCorrection?: number;

    @ApiPropertyOptional()
    @IsOptional()
    note?: string;

}
