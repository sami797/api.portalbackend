import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class MeDto {

    @ApiPropertyOptional({default: true })
    @IsOptional()
    @IsBoolean()
    @ParseBoolean()
    roles?: boolean;
    
}