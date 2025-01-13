import { ApiPropertyOptional } from '@nestjs/swagger';
import { SystemLogs } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional} from 'class-validator';

export class SystemLogsFiltersDto implements Partial<SystemLogs>{

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
    table?: string;

    @ApiPropertyOptional()
    @IsOptional()
    tableColumnKey?: string;

    @ApiPropertyOptional()
    @IsOptional()
    tableColumnValue?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    organizationId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    addedById?: number;

}