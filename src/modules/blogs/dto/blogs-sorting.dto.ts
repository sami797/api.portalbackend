import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum BlogsSortableFields {
    "addedDate" = "addedDate",
    "title" = "title",
}

export class BlogsSortingDto{

    @ApiProperty({enum: BlogsSortableFields, default : BlogsSortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(BlogsSortableFields)
    @Type(() => String)
    sortByField: BlogsSortableFields = BlogsSortableFields.addedDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}