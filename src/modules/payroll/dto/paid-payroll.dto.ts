import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty } from "class-validator";
import { ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class PaidPayrollsDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a payroll ids"})
    @ParseCustomNumberArray()
    ids: number | number[]
}