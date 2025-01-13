import { ApiPropertyOptional } from '@nestjs/swagger';
import { Enquiry } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, Max, Min, MinLength, ValidateNested } from 'class-validator';
import { EnquirySource, EnquiryStatus } from 'src/config/constants';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';

export class EnquiryFiltersDto implements Partial<Enquiry>{

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @MinLength(4)
    phone?: string;

    @ApiPropertyOptional({enum: EnquiryStatus})
    @IsOptional()
    @IsEnum(EnquiryStatus)
    @Type(() => Number)
    status?: number;

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
    name?: string;

    @ApiPropertyOptional({enum: EnquirySource})
    @IsOptional()
    @IsEnum(EnquirySource)
    source?: keyof typeof EnquirySource

    @ApiPropertyOptional()
    @IsOptional()
    userAgent?: string;

    @ApiPropertyOptional()
    @IsOptional()
    userIP?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    hasConcerns?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    assignedToId?: number;
}