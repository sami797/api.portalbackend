import { ApiPropertyOptional } from "@nestjs/swagger";
import { Attendance} from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsDateString, IsEnum, IsOptional } from "class-validator";
import { AttendanceEntryType } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export class AttendanceFilters implements Partial<Attendance> {

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    fromDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    toDate?: Date;

    @ApiPropertyOptional({enum: AttendanceEntryType})
    @IsOptional()
    @Type(() => Number)
    @IsEnum(AttendanceEntryType)
    type?: TypeFromEnumValues<typeof AttendanceEntryType>;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    userId: number;

}