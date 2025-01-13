import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export class CreateAttendanceDto implements Prisma.AttendanceUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide checkin date & time"})
    @IsDate()
    @Type(() => Date)
    checkIn?: Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide checkout date & time"})
    @IsDate()
    @Type(() => Date)
    checkOut?: Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide user ID"})
    userId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    note?: string;
}
