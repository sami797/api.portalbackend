import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsOptional } from "class-validator";

export class PayrollFiltersDto implements Partial<Prisma.PayrollUncheckedCreateInput> {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    payrollCycleId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    userId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;
}