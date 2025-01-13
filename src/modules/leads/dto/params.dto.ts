import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class ParamsDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    id: number;

}

export class LeadSlug{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => String)
    slug: string;

}