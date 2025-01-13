import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class ParamsDto{

    @ApiProperty({description: "In most of the case this is an organization ID"})
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    id: number;

}

export class FindOrgByUUID{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid uuid"})
    uuid: string;

}
