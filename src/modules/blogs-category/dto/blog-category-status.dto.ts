import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNotIn } from "class-validator";
import { BlogsCategoryStatus } from "src/config/constants";

export class BlogCategoryStatusDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid status"})
    @Type(() => Number)
    @IsEnum(BlogsCategoryStatus)
    @IsNotIn([BlogsCategoryStatus["Verified & Published"]], {message: "Please use a different API to verify and Publish the Blogs"})
    status: number;

}