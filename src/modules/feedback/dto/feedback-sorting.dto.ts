import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum FeedbackSortableFields {
    "addedDate" = "addedDate",
    "rating" = "rating"
}

export class FeedbackSortingDto{

    @ApiProperty({enum: FeedbackSortableFields, default : FeedbackSortableFields.addedDate, required: false})
    @IsOptional()
    @IsEnum(FeedbackSortableFields)
    @Type(() => String)
    sortByField: keyof typeof FeedbackSortableFields = FeedbackSortableFields.addedDate

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}