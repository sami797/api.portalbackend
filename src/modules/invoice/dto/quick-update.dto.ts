import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class QuickUpdateInvoice {
    @ApiProperty()
    @IsNotEmpty({message: "Please choose a project"})
    @Type(() => Number)
    projectId: number
}