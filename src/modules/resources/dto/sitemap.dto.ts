import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class SitemapDto {
    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid sitemap data"})
    data: string
}