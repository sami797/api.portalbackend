import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Payroll } from "../entities/payroll.entity";
import { FileVisibility } from "@prisma/client";
import { ResourcesLocation } from "src/config/constants";

export class PayrollResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Payroll;
}

export class PayrollResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Payroll;
}

export function getDynamicUploadPath(){
    let basepath = "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation.payroll +'/'+currentDate;
}