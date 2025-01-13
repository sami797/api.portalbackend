import { Department, Payroll, User } from "@prisma/client";
import { UserAttendanceType } from "src/modules/attendance/entities/attendance.entity";

export class PayrollReportSheetDto {
    sheetName: string;
    data: {
        employee: Partial<User & {Department: Partial<Department>}>, 
        payroll: Payroll
        attendance: UserAttendanceType[]
    }
}