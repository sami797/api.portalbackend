import { ApiProperty } from "@nestjs/swagger";
import { LeaveCredits } from "@prisma/client";

export class LeaveCredit implements LeaveCredits {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: number;

    @ApiProperty()
    daysCount: number;

    @ApiProperty()
    note: string;

    @ApiProperty()
    isDeleted: boolean;

    @ApiProperty()
    entryType: number;

    @ApiProperty()
    addedDate: Date;

}
