import { ApiProperty} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class BlogsCategoryPaginationDto{

    @ApiProperty({default: 25, required: false})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Max(500)
    @Min(1)
    perPage: number = 10;

    @ApiProperty({default: 1, required: false})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

}