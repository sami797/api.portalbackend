import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { SitePage } from "../entities/site-page.entity";

export class SitePageResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: SitePage
}

export class SitePageResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: SitePage
}