import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

export class UpdateProjectStatus {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide projectId"})
    @Type(() => Number)
    @IsInt()
    projectId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide project status"})
    @Type(() => Number)
    @IsInt()
    projectStateId: number;
}