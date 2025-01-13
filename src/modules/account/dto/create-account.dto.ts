import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class CreateAccountDto implements Prisma.AccountUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message:"Please provide the same account code that is in XERO account"})
    accountCode: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please give a title"})
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    xeroType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    bankAccountNumber?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose if transaction in this account should be shown in expenses column"})
    @ParseBoolean()
    showInExpenseClaims?: boolean;
}
