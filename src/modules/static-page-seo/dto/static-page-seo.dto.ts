import { ApiProperty } from "@nestjs/swagger";
import { StaticPageSeo } from "../entities/static-page-seo.entity";
import { ResponseSuccess } from "src/common-types/common-types";

export const StaticPageSEOFileUploadPath = '/public/static-page-seo/';

export class StaticPageSEOResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: StaticPageSeo
}
export class StaticPageSEOResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: StaticPageSeo
}