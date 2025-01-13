import { ApiProperty } from "@nestjs/swagger";
import { AlertsType as __AlertsType, Prisma } from "@prisma/client";
export class AlertsType implements Partial<__AlertsType> {

    @ApiProperty()
    id: number;

    @ApiProperty()
    slug: string;

    @ApiProperty()
    isPublished: boolean;

    @ApiProperty()
    isDeleted: boolean;

    @ApiProperty()
    addedDate: Date;

}
