import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

export class RemoveProjectMember {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide projectId"})
    @Type(() => Number)
    @IsInt()
    projectId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide user Id"})
    @Type(() => Number)
    @IsInt()
    userId: number;
}

export class RemoveProjectClient {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide projectId"})
    @Type(() => Number)
    @IsInt()
    projectId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide client Id"})
    @Type(() => Number)
    @IsInt()
    clientId: number;
}