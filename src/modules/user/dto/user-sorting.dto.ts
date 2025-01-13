import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum SortableFields {
    "email" = "email",
    "name" = "name",
    "addedDate" = "addedDate"
}

export class UserSortingDto{

    @ApiProperty({enum: SortableFields, default : SortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(SortableFields)
    @Type(() => String)
    sortByField: SortableFields = SortableFields.name

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.asc

}