import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsDate, IsDateString, IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";
import { IsDateGreaterThan } from "src/helpers/class-validator-custom-decorators";

export class CreateLeaveRequestDto implements Prisma.LeaveRequestUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid leave type"})
    @Type(() => Number)
    leaveTypeId: number;

    @ApiPropertyOptional()
    @IsOptional()
    purpose?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide when you want to take a leave from"})
    @IsDate()
    @Type(() => Date)
    leaveFrom?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide till when you want to take a leave"})
    @IsDate()
    @Type(() => Date)
    @IsDateGreaterThan('leaveFrom', {message: "To date must be greater than Leave From Date"})
    leaveTo?: string;

    @ApiPropertyOptional({type: "file", isArray: true})
    @IsOptional()
    @Exclude()
    files?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isPaid?: boolean;
}
