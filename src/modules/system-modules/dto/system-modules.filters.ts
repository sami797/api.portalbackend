import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class SystemModuleFilters {
    @ApiPropertyOptional({type: 'boolean'})
    @IsBoolean()
    @ParseBoolean()
    fetchPermissions: boolean = true;
}