import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transactions } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsIn, IsInt, IsOptional } from 'class-validator';
import { LeadsStatus, TransactionStatus } from 'src/config/constants';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';
import { IsEnumArray } from 'src/helpers/class-validator-custom-decorators';
import { TypeFromEnumValues } from 'src/helpers/common';

export class TransactionFiltersDto implements Partial<Transactions>{

    @ApiPropertyOptional({enum: TransactionStatus, isArray: true})
    @IsOptional()
    @IsEnumArray(TransactionStatus)
    @IsArray()
    @Type(() => Number)
    __status: TypeFromEnumValues<typeof TransactionStatus>[]; 

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
    transactionReference?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    onlyGovernmentFees?: boolean;


    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    onlyInvoicePayments?: boolean;

}