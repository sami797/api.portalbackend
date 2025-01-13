import { ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional } from "class-validator";
import { TaskStatus, TaskType } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export enum TaskAssignedType  {
    "assignedTask" = "assignedTask",
    "myTask" = "myTask"
}

export class TaskFilters {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectId: number;

    @ApiPropertyOptional({enum: TaskStatus})
    @IsOptional()
    @Type(() => Number)
    status: number;

    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @Type(() => Number)
    @IsArray()
    userIds?: number[];

    @ApiPropertyOptional({enum: TaskAssignedType})
    @IsOptional()
    @IsEnum(TaskAssignedType)
    type: keyof typeof TaskAssignedType;

    @ApiPropertyOptional({enum: TaskType})
    @IsOptional()
    @Type(() => Number)
    taskType?: TypeFromEnumValues<typeof TaskType> ;
}