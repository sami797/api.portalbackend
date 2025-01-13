import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Task } from "../entities/task.entity";
import { FileVisibility } from "@prisma/client";
import { ResourcesLocation } from "src/config/constants";

export class TaskResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Task
}

export class TaskResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Task
}

export function getDynamicUploadPath(visibility: FileVisibility = FileVisibility.organization){
    let basepath = (visibility === FileVisibility.public) ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
        /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation.task +'/'+currentDate;
}