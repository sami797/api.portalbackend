import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class QuickUpdateQuotation {
    @ApiProperty()
    @IsNotEmpty({message: "Please choose a project"})
    @Type(() => Number)
    projectId: number

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    submissionById: number
    
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectTypeId: number
}