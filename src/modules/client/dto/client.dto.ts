import { ApiProperty } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Client } from "../entities/client.entity";
import { Prisma } from "@prisma/client";

export class ClientResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Client
}

export class ClientResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Client
}

export const ClientDefaultAttributes : Prisma.ClientSelect  = {
    id: true,
    uuid: true,
    name: true,
    email: true,
    phone: true,
    phoneCode: true
}