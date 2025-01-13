import { ApiProperty } from "@nestjs/swagger";
import { TaxRate as TaxRateModel } from "@prisma/client";
export class TaxRate implements Partial<TaxRateModel> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    taxType: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    accountType: number;

    @ApiProperty()
    rate: number;
}
