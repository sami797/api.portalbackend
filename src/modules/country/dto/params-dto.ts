import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsNumberString } from 'class-validator';

export class ParamsDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    id: number;

}
