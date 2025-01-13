import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class CreateDiaryDto implements Prisma.DailyRoutineUncheckedCreateInput {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    taskTypeId: number

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid data"})
    remarks?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid data"})
    @Type(() => Number)
    noOfHours?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid data"})
    @Type(() => Number)
    @IsInt()
    projectId?: number;

    @Exclude()
    userId?: number;
}