import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class ParamsDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    id: number;

}

export class DataBySlugDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid slug"})
    slug: string;

}

export class RemoveRelationDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    pageId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    sectionId: number;

}


export class RemoveMultipleRelationDto{

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid id"})
    @Type(() => Number)
    @IsInt()
    pageId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid ids"})
    @Type(() => Number)
    @IsArray()
    sectionIds: number[];

}