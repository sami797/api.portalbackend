import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Client } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";
import { ClientType } from "src/config/constants";
import { ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class ClientFiltersDto implements Partial<Client> {

    @ApiPropertyOptional({type: "array"})
    @IsOptional()
    @ParseCustomNumberArray()
    ids: number | Array<number>
    
    @ApiPropertyOptional()
    @IsOptional()
    name: string;

    @ApiPropertyOptional({enum: ClientType})
    @IsOptional()
    @IsEnum(ClientType)
    @Type(() => Number)
    type:  typeof ClientType[keyof typeof ClientType];

    @ApiPropertyOptional()
    @IsOptional()
    email: string;

    @ApiPropertyOptional()
    @IsOptional()
    phone: string;
}
