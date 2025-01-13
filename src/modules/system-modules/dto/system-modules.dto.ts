import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { UpdateSystemModuleDto } from "./update-system-module.dto";

export class SystemModuleDto extends UpdateSystemModuleDto{
    @ApiProperty()
    id: number;
}

export class SystemModuleResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: SystemModuleDto
}
export class SystemModuleResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: SystemModuleDto
}

export const systemModulesIconUploadPath = '/public/modules/';