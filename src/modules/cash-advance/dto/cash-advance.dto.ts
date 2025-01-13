import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { CashAdvance } from "../entities/cash-advance.entity";
import { ResourcesLocation } from "src/config/constants";

export class CashAdvanceResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: CashAdvance
}

export class CashAdvanceResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: CashAdvance
}

export function getDynamicUploadPath(){
    let basepath = "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation["cash-advance"] +'/'+currentDate;
}