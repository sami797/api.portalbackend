import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { FeedbackRatingRange } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export class CreateFeedbackDto implements Prisma.FeedbackUncheckedCreateInput {

    @ApiProperty({enum: FeedbackRatingRange})
    @IsNotEmpty({message: "Please provide rating"})
    @IsEnum(FeedbackRatingRange)
    @Type(() => Number)
    rating?: TypeFromEnumValues<typeof FeedbackRatingRange>;

    @ApiPropertyOptional()
    @IsOptional()
    comment?: string;

    @ApiPropertyOptional({type: "file", isArray: true})
    @IsOptional()
    @Exclude()
    files?: string;

    @Exclude()
    addedById: number

}
