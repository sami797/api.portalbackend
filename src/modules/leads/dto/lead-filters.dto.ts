import { ApiPropertyOptional } from '@nestjs/swagger';
import { Leads } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';
import { LeadsStatus } from 'src/config/constants';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';
import { IsEnumArray } from 'src/helpers/class-validator-custom-decorators';

export class LeadsFiltersDto implements Partial<Leads>{
  
    @ApiPropertyOptional({enum: LeadsStatus, isArray: true})
    @IsOptional()
    @IsArray()
    @IsEnumArray(LeadsStatus)
    @Type(() => Number)
    __status?: number[];

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
    @Type(() => Number)
    clientId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    enquiryId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    assignedToId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    representativeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectTypeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    fetchCompleted?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    hasConcerns?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    projectTypeTitle?: string; 
    
}