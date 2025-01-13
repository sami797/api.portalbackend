import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class NotificationFilters {
    @ApiPropertyOptional({default: true})
    @IsOptional()
    @ParseBoolean()
    showUnreadOnly: boolean = true
}