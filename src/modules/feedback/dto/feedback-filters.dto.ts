import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Feedback } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";
import { FeedbackRatingRange, FeedbackType } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export class FeedbackFiltersDto implements Partial<Feedback> {

    @ApiPropertyOptional({enum: FeedbackType})
    @IsOptional()
    @Type(() => Number)
    @IsEnum(FeedbackType)
    type: TypeFromEnumValues<typeof FeedbackType>;;

    @ApiPropertyOptional()
    @IsOptional()
    url: string;
    
    @ApiPropertyOptional({enum: FeedbackRatingRange})
    @IsOptional()
    @IsEnum(FeedbackRatingRange)
    @Type(() => Number)
    rating?: TypeFromEnumValues<typeof FeedbackRatingRange>;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    addedById: number;

}