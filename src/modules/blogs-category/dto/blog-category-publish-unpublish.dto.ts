import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class PublishUnpublish {
    @ApiProperty()
    @ParseBoolean()
    @IsBoolean()
    status: boolean
}