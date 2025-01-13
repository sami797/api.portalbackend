import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Permit } from "../entities/permit.entity";
import { FileVisibility } from "@prisma/client";
import { ResourcesLocation } from "src/config/constants";

export class PermitResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Permit;
}

export class PermitResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Permit;
}

export function getDynamicUploadPath(visibility: FileVisibility = FileVisibility.organization){
    let basepath = (visibility === FileVisibility.public) ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation.permits +'/'+currentDate;
}
