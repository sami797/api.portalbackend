import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

export class RemoveTaskMember {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide projectId"})
    @Type(() => Number)
    @IsInt()
    taskId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide projectId"})
    @Type(() => Number)
    @IsInt()
    userId: number;
}