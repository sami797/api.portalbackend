import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { LeaveRequest } from "../entities/leave-request.entity";

export class LeaveRequestResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: LeaveRequest
}

export class LeaveRequestResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: LeaveRequest
}

export function getDynamicUploadPath(){
    let basepath = "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    return basepath+'/leave-request/'+currentDate;
}