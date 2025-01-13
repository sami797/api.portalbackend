import { ApiProperty } from "@nestjs/swagger";
import { FaqsCategory as PrismaFaqsCategory } from "@prisma/client";

export class FaqsCategory implements Partial<PrismaFaqsCategory> {
    @ApiProperty()
    slug?: string;

    @ApiProperty()
    isDeleted?: boolean;

    @ApiProperty()
    isPublished?: boolean;

    @ApiProperty()
    language?: string;

    @ApiProperty()
    title?: string;

    @ApiProperty()
    description?: string;
}
