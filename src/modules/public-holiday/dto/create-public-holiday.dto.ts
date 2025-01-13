import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDate, IsDateString, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";

export class CreatePublicHolidayDto implements Partial<Prisma.PublicHolidayUncheckedCreateInput> {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter holiday title"})
    title?: string;

    @ApiProperty({isArray: true, type: 'date'})
    @IsNotEmpty({message:"Please choose which date"})
    @IsDate({each: true})
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => Date)
    dates?: string[];
}
