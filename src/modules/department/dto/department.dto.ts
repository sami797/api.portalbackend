import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Department } from "../entities/department.entity";

export class DepartmentResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Department;
}

export class DepartmentResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Department;
}
