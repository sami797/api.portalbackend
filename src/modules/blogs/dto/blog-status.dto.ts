import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNotIn } from "class-validator";
import { BlogsStatus } from "src/config/constants";

export class BlogStatusDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid status"})
    @Type(() => Number)
    @IsEnum(BlogsStatus)
    @IsNotIn([BlogsStatus["Verified & Published"]], {message: "Please use a different API to verify and Publish the Blogs"})
    status: number;

}