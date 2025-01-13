import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { LeaveType } from "../entities/leave-type.entity";

export class LeaveTypeResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: LeaveType
}

export class LeaveTypeResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: LeaveType
}