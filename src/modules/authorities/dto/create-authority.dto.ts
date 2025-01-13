import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsNotEmpty } from "class-validator";
import { SlugifyString } from "src/helpers/class-transformer-custom-decorator";

export class CreateAuthorityDto implements Prisma.AuthoritiesCreateManyInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid slug"})
    @SlugifyString()
    slug: string;
}
