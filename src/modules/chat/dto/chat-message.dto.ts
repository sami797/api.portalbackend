import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class ChatMessageDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide project ID"})
    @Type(() => Number)
    projectId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid message"})
    message: string
}