import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsDateString, IsEnum, IsOptional } from "class-validator";
import { LeaveRequestStatus } from "src/config/constants";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";
import { TypeFromEnumValues } from "src/helpers/common";

export class LeaveRequestFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    userId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    fetchOpenRequest: boolean

    @ApiPropertyOptional({enum: LeaveRequestStatus})
    @IsOptional()
    @IsEnum(LeaveRequestStatus)
    @Type(() => Number)
    status: TypeFromEnumValues<typeof LeaveRequestStatus>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;
}