import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateProjectNoteDto implements Prisma.ProjectConversationUncheckedCreateInput {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a message"})
    message: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a projectId"})
    @Type(() => Number)
    projectId: number
}