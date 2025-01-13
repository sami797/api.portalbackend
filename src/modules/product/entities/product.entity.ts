import { ApiProperty } from "@nestjs/swagger";
import { Product as ProductModel } from "@prisma/client";
export class Product implements ProductModel {
    @ApiProperty()
    id: number;

    @ApiProperty()
    xeroReference: string;

    @ApiProperty()
    productCode: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    quantity: number;

    @ApiProperty()
    unitPrice: number;

    @ApiProperty()
    accountId: number;

    @ApiProperty()
    taxRateId: number;
}
