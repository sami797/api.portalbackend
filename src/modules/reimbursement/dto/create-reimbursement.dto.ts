import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class ReimbursementReceipts implements Prisma.ReimbursementReceiptUncheckedCreateInput {

    @ApiProperty({type: "file", isArray: true})
    @Exclude()
    file: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please write a receipt title"})
    title?: string;

    @ApiProperty({required: true})
    @IsNotEmpty({message: "Please write a amount you want to claim from the receipt"})
    @IsNumber()
    @Type(() => Number)
    claimedAmount : number;
}

export class CreateReimbursementDto implements Prisma.ReimbursementUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please write a purpose"})
    purpose?: string;

    @ApiProperty({ isArray: true, type: ReimbursementReceipts })
    @IsNotEmpty({ message: "Please provide the receipts information" })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReimbursementReceipts)
    reimbursementReceipts: Array<ReimbursementReceipts>;
}
