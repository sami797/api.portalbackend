import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum AttendanceSortableFields {
    "checkIn" = "checkIn",
    "addedDate" = "addedDate"
}

export class AttendanceSortingDto{

    @ApiProperty({enum: AttendanceSortableFields, default : AttendanceSortableFields.checkIn, required: false})
    @IsOptional()
    @IsEnum(AttendanceSortableFields)
    @Type(() => String)
    sortByField: keyof typeof AttendanceSortableFields = AttendanceSortableFields.checkIn

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.asc

}