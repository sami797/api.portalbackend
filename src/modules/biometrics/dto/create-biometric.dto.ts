import { ApiProperty } from "@nestjs/swagger";
import { BiometricsChecksType, Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty } from "class-validator";

export class CreateBiometricDto implements Prisma.BiometricsChecksUncheckedCreateInput {
    @ApiProperty({enum: BiometricsChecksType})
    @IsNotEmpty({message: "Please select check in or out"})
    @IsEnum(BiometricsChecksType)
    mode?: BiometricsChecksType;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide date & time"})
    @IsDate()
    @Type(() => Date)
    checkIn?:  Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide user ID"})
    userId?: number;
}
