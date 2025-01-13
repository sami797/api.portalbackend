import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsHexColor, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean, SlugifyString } from "src/helpers/class-transformer-custom-decorator";

export class CreateProjectStateDto implements Prisma.ProjectStateCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid slug"})
    @SlugifyString(false, '_')
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsHexColor()
    bgColor: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsHexColor()
    textColor: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    shouldCloseProject?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    order?: number;
    

}
