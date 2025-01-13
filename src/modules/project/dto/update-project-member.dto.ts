import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateProjectMember {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide projectId"})
    @Type(() => Number)
    @IsInt()
    projectId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    clientRepresentativeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    projectInchargeId?: number[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(()=> Number)
    supportEngineersId?: number[]

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(()=> Number)
    clients?: number[]
}