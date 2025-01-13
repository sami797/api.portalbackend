import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum SavedSearchesSortableFields {
    "addedDate" = "addedDate",
}

export class SavedSearchesSortingDto{

    @ApiProperty({enum: SavedSearchesSortableFields, default : SavedSearchesSortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(SavedSearchesSortableFields)
    @Type(() => String)
    sortByField: SavedSearchesSortableFields = SavedSearchesSortableFields.addedDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}