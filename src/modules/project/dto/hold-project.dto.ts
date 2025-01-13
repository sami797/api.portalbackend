import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class HoldProjectDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a short comment why you are holding this project"})
    comment: string
}

export class UnholdProjectDto {
    @ApiPropertyOptional()
    @IsOptional()
    comment: string
}