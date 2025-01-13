import { ApiProperty } from "@nestjs/swagger";
import { FileVisibility, Prisma } from "@prisma/client";
import { ResponseSuccess } from "src/common-types/common-types";
import { Project } from "../entities/project.entity";
import { ResourcesLocation } from "src/config/constants";

export class ProjectImages implements Prisma.FileManagementCreateInput {

    @ApiProperty()
    id: number

    @ApiProperty()
    uuid?: string;

    @ApiProperty()
    file: string

    @ApiProperty()
    name: string

    @ApiProperty()
    isTemp?: boolean;

}


export function getDynamicUploadPath(visibility: FileVisibility = FileVisibility.organization){
    let basepath = (visibility === FileVisibility.public) ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation.projects +'/'+currentDate;
}
// export const propertyFileUploadPath = getDynamicUploadPath();


export class ProjectResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Project
}

export class ProjectResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Project
}

export class ProjectImagesResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: ProjectImages
}

export const ProjectDefaultAttributes : Prisma.ProjectSelect  = {
    id: true,
    slug: true,
    title: true,
    referenceNumber: true
}