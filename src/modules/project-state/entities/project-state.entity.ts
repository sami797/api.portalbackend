import { ProjectState as __ProjectState } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class ProjectState implements Partial<ProjectState> {
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
