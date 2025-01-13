import { ApiProperty } from "@nestjs/swagger";
import { ProjectType as __ProjectType } from "@prisma/client";
export class ProjectType implements Partial<__ProjectType> {

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
