import { ApiProperty } from "@nestjs/swagger";
import { Faqs as PrismaFaqs } from "@prisma/client";

export class Faq implements Partial<PrismaFaqs> {
    @ApiProperty()
    slug?: string;

    @ApiProperty()
    isDeleted?: boolean;

    @ApiProperty()
    isPublished?: boolean;


    @ApiProperty()
    title?: string;

    @ApiProperty()
    description?: string;
}
