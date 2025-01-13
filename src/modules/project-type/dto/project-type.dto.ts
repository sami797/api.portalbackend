import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { ProjectType } from "../entities/project-type.entity";

export class ProjectTypeResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: ProjectType;
}

export class ProjectTypeResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: ProjectType;
}
