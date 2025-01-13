import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class OrganizationMetaDataDto {
    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    @IsBoolean()
    fetchMetaData: boolean
}