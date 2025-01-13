import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { BlogCategory } from "../entities/blog-category.entity";

export class BlogsCategoryResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: BlogCategory
}

export class BlogsCategoryResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: BlogCategory
}

export const blogsFileUploadPath = 'public/blogs-category';