import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class LeaveTypeFilters {
    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isPublished: boolean;
}