import { ApiProperty } from "@nestjs/swagger";
import { Authorities } from "@prisma/client";
export class Authority implements Partial<Authorities> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    title: string;

    @ApiProperty()
    slug: string;

    @ApiProperty()
    isPublished: boolean;

    @ApiProperty()
    isDeleted: boolean;

    @ApiProperty()
    addedDate: Date;

}
