import { ApiProperty} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum TaskSortableFields {
    "addedDate" = "addedDate",
    "priority" = "priority",
    "order" = "order",
    "taskEndOn" = "taskEndOn"
}

export class TaskSortingDto{

    @ApiProperty({enum: TaskSortableFields, default : TaskSortableFields.order, required: false})
    @IsOptional()
    @IsEnum(TaskSortableFields)
    @Type(() => String)
    sortByField: TaskSortableFields = TaskSortableFields.order

    @ApiProperty({ default: Prisma.SortOrder.asc, required: false, enum: Prisma.SortOrder })
    @IsOptional()
    @IsEnum(Prisma.SortOrder)
    @Type(() => String)
    sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

}