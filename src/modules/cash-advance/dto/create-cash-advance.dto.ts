import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateCashAdvanceDto implements Prisma.CashAdvanceRequestUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid amount in AED"})
    @Type(() => Number)
    requestAmount?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a reason"})
    purpose?: string;

    @ApiPropertyOptional({type: "file", isArray: true})
    @IsOptional()
    @Exclude()
    files?: string;
}
