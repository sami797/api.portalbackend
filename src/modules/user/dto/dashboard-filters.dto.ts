import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum DashboardDateRange {
    "7_days",
    "30_days",
    "60_days",
    "90_days",
    "180_days",
    "365_days"
}

export class DashboardFiltersDto {
    @ApiPropertyOptional({enum: DashboardDateRange})
    @IsOptional()
    @IsEnum(DashboardDateRange)
    range: keyof typeof DashboardDateRange = '30_days';

}