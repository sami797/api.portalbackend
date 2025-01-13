import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional } from "class-validator";

export class CreateLeaveCreditDto implements Prisma.LeaveCreditsUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please choose user"})
    @Type(() => Number)
    userId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter number of days"})
    @Type(() => Number)
    daysCount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    note?: string;
}
