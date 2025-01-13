import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsNotEmpty } from "class-validator";

export class CreateBrandingThemeDto implements Prisma.BrandingThemeUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter title"})
    title?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter payment terms"})
    paymentTerms?: string;

}
