import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateTaskMember {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide taskId"})
    @Type(() => Number)
    @IsInt()
    taskId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(()=> Number)
    assignedTo?: number[]
}