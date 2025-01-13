import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class LeaveRequestInfoDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide when you want to take a leave from"})
    @IsDateString()
    fromDate?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide till when you want to take a leave"})
    @IsDateString()
    toDate?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide leave type id"})
    @IsInt()
    @Type(() => Number)
    leaveTypeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isPaid: boolean
}