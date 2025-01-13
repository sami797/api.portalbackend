import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateStaticPageSeoDto implements Prisma.StaticPageSEOUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter SEO Title"})
    seoTitle: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter SEO description"})
    seoDescription: string;

    @ApiProperty({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    image?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose a country"})
    @Type(() => Number)
    countryId?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose a country"})
    @Type(() => Number)
    sitePageId?: number;
}
