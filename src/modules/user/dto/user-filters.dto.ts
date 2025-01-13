import { ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { OrganizationStatus, UserStatus, UserType } from 'src/config/constants';
import { ParseBoolean, ParseCustomNumberArray } from 'src/helpers/class-transformer-custom-decorator';

export class UserFiltersDto implements Partial<User>{

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @MinLength(4)
    phone?: string;

    @ApiPropertyOptional({enum: UserStatus})
    @IsOptional()
    @IsEnum(UserStatus)
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
    organizationId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    departmentId?: number;

    @ApiPropertyOptional({enum: UserType})
    @IsOptional()
    @IsEnum(UserType)
    @Type(() => Number)
    userType?: number;

    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @ParseCustomNumberArray()
    ids: number | Array<number>

    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    roleIds: Array<number>


    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @IsArray()
    roleSlugs: Array<string>

    @ApiPropertyOptional()
    @IsOptional()
    departmentSlug: string;
}