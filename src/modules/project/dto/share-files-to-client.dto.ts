import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean, ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class ShareFilesToClient {
    @ApiProperty({type: "number", isArray: true})
    @IsNotEmpty({message: "Please select some files to share"})
    @IsArray()
    @ArrayMaxSize(10)
    @ArrayMinSize(1)
    @Type(() => Number)
    fileIds: number[];

    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    projectId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    shareInEmail: false
}