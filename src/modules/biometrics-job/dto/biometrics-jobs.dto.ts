import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { BiometricsJob } from "../entities/biometrics-job.entity";
import { ResourcesLocation } from "src/config/constants";

export class BiometricsJobResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: BiometricsJob
}

export class BiometricsJobResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: BiometricsJob
}

export function getDynamicUploadPath(){
    let basepath = "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation["biometrics-bulk-upload"] +'/'+currentDate;
}

export class BiometricsJobProcessEvent {
    biometricsJobId: number
}