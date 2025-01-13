import { Department, User } from "@prisma/client";
import { UserAttendanceType } from "src/modules/attendance/entities/attendance.entity";

export class AttendanceReportSheetDto {
    sheetName: string;
    data: {
        employee: Partial<User & {Department: Partial<Department>}>, 
        attendance: UserAttendanceType[]
    }
}