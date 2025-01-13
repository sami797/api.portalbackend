import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { BulkUploadFormat } from "../entities/bulk-upload-format.entity";

export class BulkUploadFormatResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: BulkUploadFormat
}

export class BulkUploadFormatResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: BulkUploadFormat
}
