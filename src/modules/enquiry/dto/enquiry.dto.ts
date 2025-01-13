import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Enquiry } from "../entities/enquiry.entity";
import { FileVisibility } from "@prisma/client";
import { ResourcesLocation } from "src/config/constants";

export class EnquiryResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Enquiry
}

export class EnquiryResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Enquiry
}

export function getDynamicUploadPath(visibility: FileVisibility = FileVisibility.organization){
    let basepath = (visibility === FileVisibility.public) ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation.enquiry +'/'+currentDate;
}