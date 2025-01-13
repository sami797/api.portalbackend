import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum BlogsCategorySortableFields {
    "addedDate" = "addedDate",
    "title" = "title",
}

export class BlogsCategorySortingDto{

    @ApiProperty({enum: BlogsCategorySortableFields, default : BlogsCategorySortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(BlogsCategorySortableFields)
    @Type(() => String)
    sortByField: BlogsCategorySortableFields = BlogsCategorySortableFields.addedDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}