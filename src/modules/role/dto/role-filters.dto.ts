import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class RoleFiltersDto implements Partial<Role> {

    @ApiPropertyOptional()
    @IsOptional()
    title?: string;

}