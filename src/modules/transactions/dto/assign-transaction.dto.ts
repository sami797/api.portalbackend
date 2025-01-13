import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class AssignTransactionDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter who you want to assign"})
    assignedToId: number;
}