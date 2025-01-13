import { ApiPropertyOptional } from '@nestjs/swagger';
import { SmsLogs } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional} from 'class-validator';

export class SMSLogsFiltersDto implements Partial<SmsLogs>{

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    message?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    userId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    gateway?: string;

    @ApiPropertyOptional()
    @IsOptional()
    number?: string;

    @ApiPropertyOptional()
    @IsOptional()
    status?: string;

}