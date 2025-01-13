import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma, ThresholdType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";
import { ParseBoolean, SlugifyString } from "src/helpers/class-transformer-custom-decorator";

export class CreateLeaveTypeDto implements Prisma.LeaveTypeUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty()
    @SlugifyString()
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isPaid: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isPublished: boolean;

    @ValidateIf((o:CreateLeaveTypeDto) => o.isPaid)
    @ApiProperty()
    @IsNotEmpty({message: "Please enter how many leaves are paid in a month or year"})
    @Type(() => Number)
    threshold: number;


    @ValidateIf((o:CreateLeaveTypeDto) => o.isPaid)
    @ApiProperty({enum: ThresholdType})
    @IsNotEmpty({message: "Please choose if threshold is monthly or yearly"})
    @IsEnum(ThresholdType)
    thresholdType: ThresholdType;


}
