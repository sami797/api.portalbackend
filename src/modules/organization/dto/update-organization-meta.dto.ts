import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsObject, ValidateNested } from "class-validator";
import { OrganizationMetaKeys } from "../types/Organization.types";

export class OrganizationMeta {
    @ApiProperty({enum: OrganizationMetaKeys})
    @IsNotEmpty({message: "Please select a key"})
    @IsEnum(OrganizationMetaKeys)
    key: keyof typeof OrganizationMetaKeys;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter a key value"})
    value: any
}

export class UpdateOrganizationMetaDto {

    @ApiProperty({type: OrganizationMeta, isArray: true})
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrganizationMeta)
    orgMeta: Array<OrganizationMeta>;
}

export class DeleteOrganizationMetaDto {

    @ApiProperty({description: "Organization Meta ID"})
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    id: number;
}


export class DeleteOrganizationMetaByKeyDto {

    @ApiProperty({enum: OrganizationMetaKeys})
    @IsNotEmpty({message: "Please provide the valid id"})
    @IsEnum(OrganizationMetaKeys)
    key: keyof typeof OrganizationMetaKeys;
}