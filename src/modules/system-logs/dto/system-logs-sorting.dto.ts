import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum SystemLogsSortableFields {
    "addedDate" = "addedDate"
}

export class SystemLogsSortingDto{

    @ApiProperty({enum: SystemLogsSortableFields, default : SystemLogsSortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(SystemLogsSortableFields)
    @Type(() => String)
    sortByField: keyof typeof SystemLogsSortableFields = SystemLogsSortableFields.addedDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}