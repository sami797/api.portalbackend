import { ApiProperty} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class LeadsPaginationDto{

    @ApiProperty({default: 25, required: false})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Max(500)
    @Min(1)
    perPage: number = 25;

    @ApiProperty({default: 1, required: false})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

}