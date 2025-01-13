import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { WeekDays } from "src/config/constants";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class OpeningHours {
    @ApiProperty({enum: WeekDays})
    @IsNotEmpty({message: "Day must be provided"})
    @IsEnum(WeekDays)
    @Type(() => Number)
    day: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    open: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    close: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide if it is closed or not"})
    @ParseBoolean()
    closed: boolean;

    @Exclude()
    totalHours: number = 0;
}

export class CreateWorkingHourDto implements Prisma.WorkingHoursCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter a title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(7)
    @ArrayMaxSize(7)
    @ValidateNested({each: true})
    @Type(() => OpeningHours)
    openingHours: OpeningHours[]
}
