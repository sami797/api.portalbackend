import { ApiPropertyOptional } from '@nestjs/swagger';
import { Permit, Prisma, Transactions } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional } from 'class-validator';
import { PermitClientStatus, PermitFinanceStatus } from 'src/config/constants';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';
import { TypeFromEnumValues } from 'src/helpers/common';

export class PermitFiltersDto implements Partial<Prisma.PermitScalarWhereInput>{

    @ApiPropertyOptional({enum: PermitFinanceStatus})
    @IsOptional()
    @IsEnum(PermitFinanceStatus)
    @Type(() => Number)
    financeStatus?: TypeFromEnumValues<typeof PermitFinanceStatus>;
    
    @ApiPropertyOptional({enum: PermitClientStatus})
    @IsOptional()
    @IsEnum(PermitClientStatus)
    @Type(() => Number)
    clientStatus?: TypeFromEnumValues<typeof PermitClientStatus>;

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
    @IsInt()
    @Type(() => Number)
    projectId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    clientId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    authorityId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    onlyActive: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    onlyExpired: boolean;
}