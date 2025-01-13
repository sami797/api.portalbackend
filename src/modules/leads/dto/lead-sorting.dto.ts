import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum LeadsSortableFields {
    "email" = "email",
    "name" = "name",
    "addedDate" = "addedDate"
}

export class LeadsSortingDto{

    @ApiProperty({enum: LeadsSortableFields, default : LeadsSortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(LeadsSortableFields)
    @Type(() => String)
    sortByField: keyof typeof LeadsSortableFields = LeadsSortableFields.addedDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}