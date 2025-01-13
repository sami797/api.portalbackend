import { ApiProperty } from "@nestjs/swagger";
import { Prisma, Payroll as __Payroll } from "@prisma/client";
export class Payroll implements Partial<Prisma.PayrollUncheckedCreateInput> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    monthYear: Date;

    @ApiProperty()
    userId: number;

    @ApiProperty()
    salaryId: number;

    @ApiProperty()
    payrollCycleId: number;

    @ApiProperty()
    totalWorkingDays: number;

    @ApiProperty()
    daysWorked: number;

    @ApiProperty()
    totalLates: number;

    @ApiProperty()
    totalIncompletes: number;

    @ApiProperty()
    toBeDeductedFromCurrentSalary?: number;

    @ApiProperty()
    toBeDeductedFromLeaveCredits?: number;

    @ApiProperty()
    totalAbsences?: number;

    @ApiProperty()
    totalDeduction?: number;

    @ApiProperty()
    totalReceivable?: number;
}
