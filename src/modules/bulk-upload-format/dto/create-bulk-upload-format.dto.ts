import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional } from "class-validator";
import { ParseJson } from "src/helpers/class-transformer-custom-decorator";

export type attributeTypes = "employeeNumber" | "employeeName" | "date" | "time" | "entry";

export type DataFormatTree = {
    [key in attributeTypes]: {
        name: attributeTypes, 
        position : Array<any>, 
        alternatePosition1 ?: Array<any>, 
        alternatePosition2 ?: Array<any>, 
        valueType: "string" | "array" | "number" | "comma-separated" | "space-separated" | "comma-abbreviation" | "abbreviation", 
        subTypePositon?: Array<any>,
        exist?: boolean,
        encoded?: boolean
    };
};

export class DataFields {
    
    // [x : attributeTypes] : any
}

export class CreateBulkUploadFormatDto implements Prisma.BulkUploadFormatCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a format"})
    @ParseJson()
    format: Prisma.NullTypes.JsonNull | Prisma.InputJsonValue;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseJson()
    sample?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;

    @ApiProperty()
    @IsOptional()
    comment?: string;
}
