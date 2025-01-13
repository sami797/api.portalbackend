import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude } from "class-transformer";
import { ResponseSuccess } from "src/common-types/common-types";
import { UpdateUserDto } from "./update-user.dto";
import { ResourcesLocation } from "src/config/constants";

export class UserDto extends UpdateUserDto{
    @ApiProperty({required: false})
    id?: number

    @ApiProperty({required: false})
    uid?: string

    @ApiProperty({required: false})
    addedDate?: Date | string
    
    @ApiProperty({required: false})
    addedBy?: number | null

    @ApiProperty({required: false})
    modifiedDate?: Date | string | null

    @ApiProperty({required: false})
    modifiedBy?: number | null

    @ApiProperty({required: false})
    deletedDate?: Date | string | null

    @ApiProperty({required: false})
    deletedBy?: number | null
    
}

export enum userAttributesTypes {
    PUBLIC = "public",
    PRIVATE  = "private",
    LOGIN = "login",
    GENERAL = "general"
}

type UserAttributesTypes = {
    [key : string] : Prisma.UserSelect
}

export const UserDefaultAttributes : Prisma.UserSelect = {
    id: true,
    uuid: true,
    firstName: true,
    lastName: true,
    email: true,
    profile: true,
    phone: true,
    phoneCode: true,
    dataAccessRestrictedTo: true
}

export const DepartmentDefaultAttributes : Prisma.DepartmentSelect = {
    id: true,
    title: true,
    slug: true
}

export const userAttributes : UserAttributesTypes = {
    public : {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneCode: true,
        phone: true,
        whatsapp: true,
        address: true,
        preferences: true,
        profile: true,
    },
    general: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        phoneCode: true,
        email: true,
        phone: true,
        address: true,
        preferences: true,
        profile: true,
        phoneVerified: true,
        emailVerified: true,
        whatsapp: true,
        status: true,
        AddedBy: {
            select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                email: true
            }
        },
        isPublished: true
    },
    login: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneCode: true,
        phone: true,
        address: true,
        preferences: true,
        profile: true,
        status: true,
        dataAccessRestrictedTo: true
    }
}

export function getDynamicUploadPath(visibility: "public" | "organization"){
    let basepath = (visibility === "public") ? "public" : "protected";
    let currentDate = new Date().toISOString().split('T')[0];
    /** ResourcesLocation is used such that file permission can be handled automatically based on the given path */
    return basepath+'/'+ ResourcesLocation.user +'/'+currentDate;
}

export const userFileUploadPath = 'public/user';

export class UserResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: UserDto
}

export class UserResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: UserDto
}