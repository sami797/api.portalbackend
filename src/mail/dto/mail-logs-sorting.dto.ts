import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum MailLogsSortableFields {
    "addedDate" = "addedDate"
}

export class MailLogsSortingDto{

    @ApiProperty({enum: MailLogsSortableFields, default : MailLogsSortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(MailLogsSortableFields)
    @Type(() => String)
    sortByField: keyof typeof MailLogsSortableFields = MailLogsSortableFields.addedDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}