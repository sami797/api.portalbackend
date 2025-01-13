import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean, SlugifyString } from "src/helpers/class-transformer-custom-decorator";

export class CreateProjectTypeDto implements Prisma.ProjectTypeCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid slug"})
    @SlugifyString()
    slug: string;

    @ApiProperty()
    @IsOptional()
    @ParseBoolean()
    isPublished: boolean
}
