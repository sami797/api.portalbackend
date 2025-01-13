import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsDateString, IsNotEmpty, IsOptional } from "class-validator";
import { IsDateGreaterThan, IsDateGreaterThanToday } from "src/helpers/class-validator-custom-decorators";

export class CheckCarAvailabilityDto {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    companyCarId?: number;
    
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
}