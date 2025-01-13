import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BiometricsChecksType, Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsDate, IsEnum, IsLatLong, IsLatitude, IsLongitude, IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class CheckInCheckOutBiometricDto implements Prisma.BiometricsChecksUncheckedCreateInput {
    @ApiProperty({enum: BiometricsChecksType})
    @IsNotEmpty({message: "Please select check in or out"})
    @IsEnum(BiometricsChecksType)
    mode?: BiometricsChecksType;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide latitude"})
    @IsLatitude()
    @Type(() => Number)
    latitude?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    force: boolean = false;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide latitude"})
    @IsLongitude()
    @Type(() => Number)
    longitude?: number;

    @ApiProperty({type: "file"})
    @Exclude()
    selfie?: string;

    @Exclude()
    checkIn?: Date;

    @Exclude()
    userAgent: string;

    @Exclude()
    userIP?: string;
}
