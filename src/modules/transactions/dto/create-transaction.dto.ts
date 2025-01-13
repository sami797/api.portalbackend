import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { TransactionStatus } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export class CreateTransactionDto implements Prisma.TransactionsUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please mention what is this receipt about"})
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    remarks?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose an project"})
    @Type(() => Number)
    projectId?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose an authority"})
    @Type(() => Number)
    authorityId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    invoiceId?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter an amount"})
    @Type(() => Number)
    amount?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter when transaction was made"})
    @IsDateString()
    transactionDate?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter transaction reference"})
    transactionReference?: string;

    @ApiProperty({enum: TransactionStatus})
    @IsNotEmpty({message: "Please choose transaction status"})
    @IsEnum(TransactionStatus)
    @Type(() => Number)
    status: TypeFromEnumValues<typeof TransactionStatus>

    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    receipt: string
}
