import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

export class UpdateTaskOrderDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide valid order number"})
    @IsInt()
    @Type(() => Number)
    order: number
}
