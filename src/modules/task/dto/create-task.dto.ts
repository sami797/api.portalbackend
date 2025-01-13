import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";
import { Priority, TaskStatus, TaskType } from "src/config/constants";

export class CreateTaskDto implements Prisma.TaskUncheckedCreateInput {
    @ApiPropertyOptional()
    @IsOptional({message: "Please enter valid project ID"})
    @Type(() => Number)
    projectId?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter valid title"})
    title: string;

    @ApiPropertyOptional({enum: Priority})
    @IsOptional()
    @Type(() => Number)
    priority?: number;

    @ApiPropertyOptional()
    @IsOptional()
    instructions?: string;

    @ValidateIf((o:CreateTaskDto) => o.type === TaskType.normal)
    @ApiProperty({type: "date"})
    @IsNotEmpty({message: "Please enter task start date"})
    @IsDateString()
    taskStartFrom?: string | Date;

    @ValidateIf((o:CreateTaskDto) => o.type === TaskType.normal)
    @ApiProperty({type: "date"})
    @IsNotEmpty({message: "Please enter task end date"})
    @IsDateString()
    taskEndOn?: string | Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(()=> Number)
    assignedTo?: number[]

    @ApiPropertyOptional({enum: TaskStatus})
    @IsOptional({message: "Please enter valid status"})
    @Type(() => Number)
    @IsEnum(TaskStatus)
    status?: number;

    @ApiPropertyOptional({enum: TaskType})
    @IsOptional({message: "Please enter valid status"})
    @Type(() => Number)
    @IsEnum(TaskType)
    type?: number;

}
