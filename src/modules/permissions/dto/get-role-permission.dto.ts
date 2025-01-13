import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class GetRolePermission {
    @ApiProperty()
    @IsNotEmpty({message:"Please provide roleId"})
    @Type(() => Number)
    @IsInt()
    roleId: number

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    moduleId: number
}