import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { SitePagesContent } from "../entities/site-pages-content.entity";

export class SitePagesContentResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: SitePagesContent
}

export class SitePagesContentResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: SitePagesContent
}


export const sitePagesContentFileUploadPath = 'public/site-pages-content';