import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum TransactionSortableFields {
    "amount" = "amount",
    "transactionDate" = "transactionDate"
}

export class TransactionSortingDto{

    @ApiProperty({enum: TransactionSortableFields, default : TransactionSortableFields.transactionDate, required: false})
    @IsOptional()
    @IsEnum(TransactionSortableFields)
    @Type(() => String)
    sortByField: TransactionSortableFields = TransactionSortableFields.transactionDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}