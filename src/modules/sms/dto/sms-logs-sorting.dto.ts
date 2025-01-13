import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum SMSLogsSortableFields {
    "sentDate" = "sentDate"
}

export class SMSLogsSortingDto{

    @ApiProperty({enum: SMSLogsSortableFields, default : SMSLogsSortableFields.sentDate, required: false})
    @IsOptional()
    @IsEnum(SMSLogsSortableFields)
    @Type(() => String)
    sortByField: SMSLogsSortableFields = SMSLogsSortableFields.sentDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}