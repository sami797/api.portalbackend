import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Lead } from "../entities/lead.entity";
import { FileVisibility, Prisma } from "@prisma/client";
import { ResourcesLocation } from "src/config/constants";

export class LeadsResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Lead
}

export class LeadsResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Lead
}

export function getDynamicUploadPath(visibility: FileVisibility = FileVisibility.organization){
    let basepath = (visibility === FileVisibility.public) ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    //enquiry is used as files are shared with enquiry
    return basepath+'/'+ ResourcesLocation.enquiry +'/'+currentDate;
}

export const LeadsDefaultAttributes: Prisma.LeadsSelect = {
    id: true,
    uuid: true, 
    xeroTenantId: true,
    clientId: true
}