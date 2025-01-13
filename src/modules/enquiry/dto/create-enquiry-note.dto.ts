import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class CreateEnquiryNoteDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter a message"})
    note : string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isConcern: boolean
}