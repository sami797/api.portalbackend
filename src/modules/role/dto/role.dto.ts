import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { UpdateRoleDto } from "./update-role.dto";

export class RoleDto extends UpdateRoleDto{
    @ApiProperty({required: false})
    id?: number

    @ApiProperty({required: false})
    addedDate?: Date | string
    
    @ApiProperty({required: false})
    addedBy?: number | null

    @ApiProperty({required: false})
    modifiedDate?: Date | string | null

    @ApiProperty({required: false})
    modifiedBy?: number | null

    @ApiProperty({required: false})
    deletedDate?: Date | string | null

    @ApiProperty({required: false})
    deletedBy?: number | null
    
}

export class RoleResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: RoleDto
}

export class RoleResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: RoleDto
}