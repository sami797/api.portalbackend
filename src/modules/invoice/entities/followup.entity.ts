import { ApiProperty } from "@nestjs/swagger";
import { InvoiceFollowUp } from "@prisma/client";

export class Followup implements InvoiceFollowUp{
    @ApiProperty()
    id: number;

    @ApiProperty()
    note: string;

    @ApiProperty()
    isConcern: boolean;

    @ApiProperty()
    isResolved: boolean;

    @ApiProperty()
    addedDate: Date;

    @ApiProperty()
    addedById: number;

    @ApiProperty()
    invoiceId: number;

    @ApiProperty()
    isDeleted: boolean;
}