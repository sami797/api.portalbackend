import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export enum AttendanceReportType {
    "all" = "all",
    "users" = "users",
    "department" = "department", 
    "organization" = "organization",
}

export class GenerateAttendanceReport {
    @ApiProperty()
    @IsNotEmpty({message: "Please choose from Date"})
    @Type(() => Date)
    fromDate: Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose to date"})
    @Type(() => Date)
    toDate: Date;

    @ApiProperty({enum: AttendanceReportType})
    @IsNotEmpty({message: "Please choose report type"})
    @IsEnum(AttendanceReportType)
    reportType: AttendanceReportType

    @ApiProperty()
    @ValidateIf((ele: GenerateAttendanceReport) => ele.reportType === AttendanceReportType.users )
    @IsNotEmpty({message: "Please select some user"})
    @IsArray()
    @Type(() => Number)
    userIds?: number[]

    @ApiProperty()
    @ValidateIf((ele: GenerateAttendanceReport) => ele.reportType === AttendanceReportType.department )
    @IsNotEmpty({message: "Please select department"})
    @Type(() => Number)
    departmentId?: number;

    @ApiProperty()
    @ValidateIf((ele: GenerateAttendanceReport) => ele.reportType === AttendanceReportType.organization )
    @IsNotEmpty({message:"Please choose organization"})
    @Type(() => Number)
    organizationId?: number;
}