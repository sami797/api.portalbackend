import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";

export class ReceiptAction {
    @ApiProperty()
    @IsNotEmpty({message: "Please choose receipt"})
    @Type(() => Number)
    receiptId: number

    @ApiProperty()
    @IsNotEmpty({message: "Please choose receipt"})
    @Type(() => Number)
    approvedAmount: number

    @ApiPropertyOptional()
    @IsOptional()
    comment: string

    @ApiProperty({enum: [2,3,4]})
    @IsNotEmpty({message: "Please choose receipt action, whether it is approved or rejected"})
    @IsIn([2,3,4], {message: "Please choose whether to approve or reject this receipt"})
    @Type(() => Number)
    status: 2| 3| 4
}

export class ReimbursementHrAction {


    @ApiPropertyOptional()
    @IsOptional()
    comment?: string

    @ApiProperty({ isArray: true, type: ReceiptAction })
    @IsNotEmpty({ message: "Please provide the receipts information" })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReceiptAction)
    reimbursementReceipts: Array<ReceiptAction>;
}