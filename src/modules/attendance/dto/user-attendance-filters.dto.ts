import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Attendance} from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, Max, Min } from "class-validator";
import { AttendanceEntryType } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export class UserAttendanceFilters implements Partial<Attendance> {

    @ApiProperty()
    @IsNotEmpty({message: "Please select year"})
    @Min(2000)
    @Max(new Date().getFullYear())
    @Type(() => Number)
    year?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please select month"})
    @Min(0)
    @Max(11)
    @Type(() => Number)
    month?: number;

    @ApiPropertyOptional({enum: AttendanceEntryType})
    @IsOptional()
    @Type(() => Number)
    @IsEnum(AttendanceEntryType)
    type: TypeFromEnumValues<typeof AttendanceEntryType>;

    @ApiProperty()
    @IsNotEmpty({message: "Please select user to view the attendance"})
    @Type(() => Number)
    userId: number;
}