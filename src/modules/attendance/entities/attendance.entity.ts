import { ApiProperty } from "@nestjs/swagger";
import { LeaveRequest, User, Attendance as __Attendance } from "@prisma/client";
import { AttendanceEntryType, AttendanceStatus } from "src/config/constants";
export class Attendance implements Partial<__Attendance> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    userId: number;
    
    @ApiProperty()
    type: number;
    
    @ApiProperty()
    checkIn: Date;
    
    @ApiProperty()
    checkOut: Date;
    
    @ApiProperty()
    totalHours: number;
    
    @ApiProperty()
    note: string;
    
    @ApiProperty()
    addedById: number;
    
    @ApiProperty()
    addedDate: Date;
    
}


export type UserAttendanceType = {
    recordId: number | null,
    userId: number,
    entryType?: AttendanceEntryType,
    day: Date,
    status: AttendanceStatus,
    note: string,
    checkIn?: Date,
    checkOut?: Date,
    hoursWorked: number,
    proRatedDeduction: number,
    AddedBy: Partial<User> | null,
    ModifiedBy: Partial<User> | null,
    modifiedDate?: Date,
    totalHours: number
}