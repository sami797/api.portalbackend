import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Biometric } from "../entities/biometric.entity";
import { ResourcesLocation } from "src/config/constants";

export class BiometricsResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Biometric
}

export class BiometricsResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Biometric
}

export function getDynamicUploadPath(visibility: "public" | "protected") {
    let basepath = (visibility === "public") ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath + '/' + ResourcesLocation.selfie + '/' + currentDate;
}