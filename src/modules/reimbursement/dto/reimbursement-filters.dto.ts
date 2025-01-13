import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { ReimbursementStatus } from "src/config/constants";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";
import { TypeFromEnumValues } from "src/helpers/common";

export class ReimbursementFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    userId: number

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    fetchOpenRequest: boolean

    @ApiPropertyOptional({enum: ReimbursementStatus})
    @IsOptional()
    @IsEnum(ReimbursementStatus)
    @Type(() => Number)
    status: TypeFromEnumValues<typeof ReimbursementStatus>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;
}