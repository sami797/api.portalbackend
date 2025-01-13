import { ApiProperty } from "@nestjs/swagger";
import { Transactions } from "@prisma/client";
export class Transaction implements Partial<Transactions> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: number | null;

    @ApiProperty()
    organizationId: number | null;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    currencyCode: string | null;

    @ApiProperty()
    transactionDate: Date;

    @ApiProperty()
    transactionType: number;

    @ApiProperty()
    recordType: number;

    @ApiProperty()
    status: number;

    @ApiProperty()
    cartId: string | null;

    @ApiProperty()
    transactionReference: string | null;

    @ApiProperty()
    transactionUrl: string | null;

    @ApiProperty()
    transactionData: any

    @ApiProperty()
    transactionStatus: string | null;

    @ApiProperty()
    organizationCreditPackageRefundsId: number | null;

}
