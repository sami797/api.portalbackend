import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class CreateUniqueInvoiceNumberyDto {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectId: number;
}