import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Organization } from "../entities/organization.entity";
import { Prisma } from "@prisma/client";
import { ResourcesLocation } from "src/config/constants";

export const organizationFileUploadPath = 'public/organization';

export class OrganizationResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Organization
}

export class OrganizationResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({ isArray: true })
    data: Organization
}

export function getDynamicUploadPath(visibility: "public" | "protected" | "organization") {
    let basepath = (visibility === "public") ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath + '/' + ResourcesLocation.organization + '/' + currentDate;
}

export const OrganizationDefaultAttributes: Prisma.OrganizationSelect = {
    id: true,
    uuid: true,
    name: true,
    email: true,
    logo: true,
    phone: true,
    phoneCode: true
}