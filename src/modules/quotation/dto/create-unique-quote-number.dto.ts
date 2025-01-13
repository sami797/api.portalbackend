import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateUniqueQuoteNumberyDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    revisionId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    leadId: number;
}