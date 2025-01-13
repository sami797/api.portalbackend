import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CheckQuoteDuplicacyDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid quote number"})
    quoteNumber: string

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    excludeId: number;
}