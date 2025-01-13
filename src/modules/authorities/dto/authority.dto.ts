import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Authority } from "../entities/authority.entity";
import { Prisma } from "@prisma/client";

export class AuthorityResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Authority
}

export class AuthorityResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Authority
}

export const AuthorityDefaultAttributes : Prisma.AuthoritiesSelect = {
    id: true,
    title: true,
    slug: true
}