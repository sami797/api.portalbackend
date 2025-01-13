import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Invoice } from "@prisma/client";
import { ResponseSuccess } from "src/common-types/common-types";
import { ResourcesLocation } from "src/config/constants";
import { Followup } from "../entities/followup.entity";

export class InvoiceResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Invoice
}

export class InvoiceResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({ isArray: true })
    data: Invoice
}

export class FollowupResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Followup
}

export function getDynamicUploadPath() {
    let basepath = "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath + '/' + ResourcesLocation.invoice + '/' + currentDate;
}