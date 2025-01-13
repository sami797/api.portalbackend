import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export enum PayrollReportType {
    "all" = "all",
    "users" = "users",
    "department" = "department", 
    "organization" = "organization",
}

export class GeneratePayrollReport {

    @ApiProperty()
    @IsNotEmpty({message:"Please choose payroll cycle"})
    @Type(() => Number)
    payrollCycleId?: number;

    @ApiProperty({enum: PayrollReportType})
    @IsNotEmpty({message: "Please choose report type"})
    @IsEnum(PayrollReportType)
    reportType: PayrollReportType

    @ApiProperty()
    @ValidateIf((ele: GeneratePayrollReport) => ele.reportType === PayrollReportType.users )
    @IsNotEmpty({message: "Please select some user"})
    @IsArray()
    @Type(() => Number)
    userIds?: number[]

    @ApiProperty()
    @ValidateIf((ele: GeneratePayrollReport) => ele.reportType === PayrollReportType.department )
    @IsNotEmpty({message: "Please select department"})
    @Type(() => Number)
    departmentId?: number;

    @ApiProperty()
    @ValidateIf((ele: GeneratePayrollReport) => ele.reportType === PayrollReportType.organization )
    @IsNotEmpty({message:"Please choose organization"})
    @Type(() => Number)
    organizationId?: number;
}