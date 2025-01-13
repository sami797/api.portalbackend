import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean, SlugifyString } from "src/helpers/class-transformer-custom-decorator";

export class CreateDashboardElementDto implements Prisma.DashboardElementUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty()
    @SlugifyString(false, '_')
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;
}
