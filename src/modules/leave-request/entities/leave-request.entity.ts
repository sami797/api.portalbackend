import { ApiProperty } from "@nestjs/swagger";
import {LeaveRequest as __LeaveRequest }from "@prisma/client";
export class LeaveRequest implements Partial<__LeaveRequest> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    requestById: number;

    @ApiProperty()
    typeOfLeave: number;

    @ApiProperty()
    purpose: string;

    @ApiProperty()
    leaveFrom: Date;

    @ApiProperty()
    leaveTo: Date;

    @ApiProperty()
    status: number;

    @ApiProperty()
    addedDate: Date;

    @ApiProperty()
    submittedDate: Date;
}
