import { ApiProperty } from "@nestjs/swagger";
import {DailyRoutine} from "@prisma/client"
export class Diary implements Partial<DailyRoutine> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    taskTypeId: number;

    @ApiProperty()
    remarks: string | null;

    @ApiProperty()
    noOfHours: number;

    @ApiProperty()
    projectId: number | null;

    @ApiProperty()
    userId: number | null;

    @ApiProperty()
    isPublished: boolean;

    @ApiProperty()
    isDeleted: boolean;

    @ApiProperty()
    addedDate: Date;

    @ApiProperty()
    modifiedDate: Date | null;

}
