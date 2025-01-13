import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional } from "class-validator";
import { IsDateGreaterThan, IsDateGreaterThanToday } from "src/helpers/class-validator-custom-decorators";

export class CreateCarReservationRequestDto implements Prisma.CarReservationRequestUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide when you want book comapny car"})
    @IsDate()
    @Type(() => Date)
    @IsDateGreaterThanToday()
    fromDate?: string | Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide upto when you will be taking a car"})
    @IsDate()
    @Type(() => Date)
    @IsDateGreaterThan('fromDate', {message: "To date must be greater than From Date"})
    toDate?: string | Date;
    // 2023-10-10T13:00:00.000Z Accepted

    @ApiProperty()
    @IsNotEmpty({message: "Please write your purpose"})
    purpose?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectId?: number;

    @ApiProperty({required: false, type: "file", isArray: true})
    @IsOptional()
    @Exclude()
    files?: any;
}

