import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsUrl, ValidateNested } from "class-validator";
import { UserMetaKeys } from "../types/user.types";

export class UserMeta {
    @ApiProperty({enum: UserMetaKeys})
    @IsNotEmpty({message: "Please select a key"})
    @IsEnum(UserMetaKeys)
    key: keyof typeof UserMetaKeys;

    @ApiProperty()
    @IsNotEmpty({message: "Please enter a key value"})
    value: any
}

export class UpdateUserMetaDto {

    @ApiProperty({type: UserMeta, isArray: true})
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UserMeta)
    userMeta: Array<UserMeta>;
}

export class DeleteUserMetaDto {

    @ApiProperty({description: "User Meta ID"})
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    id: number;
}


export class DeleteUserMetaByKeyDto {

    @ApiProperty({enum: UserMetaKeys})
    @IsNotEmpty({message: "Please provide the valid id"})
    @IsEnum(UserMetaKeys)
    key: keyof typeof UserMetaKeys;
}