import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { BlogsStatus } from 'src/config/constants';

export class ParamsDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    id: number;

}


export class BlogsDetail{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid slug"})
    slug: string;

}
