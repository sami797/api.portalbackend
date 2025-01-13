import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class AssignLeadsDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter who you want to assign"})
    assignedToId: number;
}