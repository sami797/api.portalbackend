import { ApiProperty } from "@nestjs/swagger";
import { PublicHoliday as __PublicHoliday } from "@prisma/client";
export class PublicHoliday implements Partial<__PublicHoliday> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    title: string;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    addedById: number;

    @ApiProperty()
    addedDate: Date;
}
