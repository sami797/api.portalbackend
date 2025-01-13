import { ApiProperty } from "@nestjs/swagger";
import { BiometricsChecks, BiometricsChecksType } from "@prisma/client";
export class Biometric implements Partial<BiometricsChecks> {
    @ApiProperty()
    id: number;

    @ApiProperty()
    mode: BiometricsChecksType;

    @ApiProperty()
    checkIn: Date;

    @ApiProperty()
    type: number;

    @ApiProperty()
    userId: number;

    @ApiProperty()
    addedById: number;

    @ApiProperty()
    biometricsJobId: number;

    @ApiProperty()
    addedDate: Date;
}
