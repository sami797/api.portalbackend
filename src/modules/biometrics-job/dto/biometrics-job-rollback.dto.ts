import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class BiometricsJobRollbackDto {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a comment why you want to rollback this job"})
    comment: string
}