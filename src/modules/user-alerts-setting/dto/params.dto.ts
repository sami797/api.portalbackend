import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsNumberString, IsString } from 'class-validator';

export class ParamsDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    alertTypeId: number;

}

export class FindBySlugDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid slug"})
    alertTypeSlug: string;

}