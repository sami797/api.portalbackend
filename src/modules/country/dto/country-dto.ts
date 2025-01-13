import { ApiProperty } from "@nestjs/swagger";
import { Country } from "../entities/country.entity";
import { ResponseSuccess } from "src/common-types/common-types";

export const countryFileUploadPath = '/public/country/';

export class CountryResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Country
}
export class CountryResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Country
}