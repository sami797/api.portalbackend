import { ApiProperty } from "@nestjs/swagger";
import { BrandingTheme as BrandingThemeModel } from "@prisma/client";
export class BrandingTheme implements BrandingThemeModel {
    @ApiProperty()
    id: number;
    @ApiProperty()

    title: string;

    @ApiProperty()
    paymentTerms: string;
}
