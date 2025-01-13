import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Exclude, Transform, Type } from 'class-transformer';
import { ValidateNested, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';


export class CreateAlertsTypeDto implements Prisma.AlertsTypeCreateInput {

    @ApiProperty()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide the alerts type slug" })
    @SlugifyString()
    slug: string;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

}
