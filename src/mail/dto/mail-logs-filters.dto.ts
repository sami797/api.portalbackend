import { ApiPropertyOptional } from '@nestjs/swagger';
import { MailSentLogs } from '@prisma/client';
import { IsDateString, IsInt, IsOptional} from 'class-validator';

export class MailLogsFiltersDto implements Partial<MailSentLogs>{

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
    subject?: string;

    @ApiPropertyOptional()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    template?: string;

}