import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class OrganizationPublishDto {

    @ApiPropertyOptional({default: false})
    @ParseBoolean()
    @IsBoolean()
    force: boolean = false

    @ApiPropertyOptional({default: false})
    @ParseBoolean()
    @IsBoolean()
    sendWelcomeEmail: boolean = false

    @ApiPropertyOptional()
    @IsOptional()
    message: string
    
}