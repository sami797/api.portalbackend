import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Permission } from "../entities/permission.entity";

export class PermissionResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Permission
}
export class PermissionResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({ isArray: true })
    data: Permission
}

export const permissionIconUploadPath = '/public/modules/';