import { ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, Max, Min, MinLength, ValidateNested } from 'class-validator';
import { OrganizationStatus, OrganizationType } from 'src/config/constants';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';

export class OrganizationFiltersDto implements Partial<Organization>{

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    ids?: number[];

    @ApiPropertyOptional()
    @IsOptional()
    @MinLength(4)
    phone?: string;

    @ApiPropertyOptional({enum: OrganizationStatus})
    @IsOptional()
    @IsEnum(OrganizationStatus)
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
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    location?: number;

    @ApiPropertyOptional({enum: OrganizationType})
    @IsOptional()
    @IsEnum(OrganizationType)
    @Type(() => Number)
    type?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    includeBranches: boolean = true;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    fetchParentOnly: boolean;
}